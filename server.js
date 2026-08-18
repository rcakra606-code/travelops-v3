import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { syncDatabase } from './scripts/db-sync.js';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

// Force Node.js to use IPv4 first. Railway does not support outbound IPv6,
// which causes ENETUNREACH errors when connecting to smtp.gmail.com
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin;
if (supabaseUrl && supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy (Railway load balancer) so express-rate-limit can accurately get IPs
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for React inline scripts compatibility if needed
  crossOriginEmbedderPolicy: false
}));

// Rate Limiting (General)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Rate Limiting (Strict for Email API)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 emails per hour
  message: { success: false, message: 'Email sending limit reached. Please try again in an hour.' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini AI Client
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// Require Supabase Admin middleware
const requireSupabaseAdmin = (req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' });
  }
  next();
};

// --- API ENDPOINTS FOR USER MANAGEMENT ---

// Get Client IP Endpoint
app.get('/api/client-info', (req, res) => {
  // Try to get real IP from proxies (e.g., x-forwarded-for) or fallback to socket remote address
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  res.json({ ip: ip || 'Unknown' });
});

// Create User
app.post('/api/admin/users', requireSupabaseAdmin, async (req, res) => {
  const { email, password, name, role, status, mustChangePassword } = req.body;
  
  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // auto-confirm since Admin created it
    });

    if (authError) throw authError;

    // 2. Insert into travelops_users (with the same ID)
    const userId = authData.user.id;
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('travelops_users')
      .insert([{
        id: userId,
        email,
        name,
        role,
        status,
        must_change_password: mustChangePassword ?? true
      }])
      .select()
      .single();

    if (profileError) throw profileError;

    res.status(200).json({ success: true, user: profileData });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Reset Password
app.put('/api/admin/users/:id/password', requireSupabaseAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    // 1. Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword
    });

    if (authError) throw authError;

    // 2. Update must_change_password and unlock in travelops_users
    const { error: profileError } = await supabaseAdmin
      .from('travelops_users')
      .update({ must_change_password: true, is_locked: false })
      .eq('id', id);

    if (profileError) throw profileError;

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete User
app.delete('/api/admin/users/:id', requireSupabaseAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Delete from Supabase Auth (this will cascade to public.travelops_users if FK is set, 
    // but just in case, we can rely on Supabase Auth deletion).
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    // If the user is already deleted from auth, we still want to proceed and clean up the database
    if (authError && !authError.message.includes('User not found')) {
      throw authError;
    }

    // 2. Explicitly delete from travelops_users in case there is no cascade or it was orphaned
    const { error: profileError } = await supabaseAdmin
      .from('travelops_users')
      .delete()
      .eq('id', id);

    if (profileError) throw profileError;

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


// --- DESTINATION & KNOWLEDGE BASE AI ENDPOINTS ---

// Helper to clean JSON returned from LLMs
function cleanJsonOutput(text) {
  if (!text) return null;
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return JSON.parse(cleaned.trim());
}

// 1. Parse Tour Itinerary PDF with Gemini Multimodal
app.post('/api/knowledge/parse-itinerary-pdf', async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'pdfBase64 is required in request body.' });
    }

    if (!aiClient) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server. Please check your .env configuration.' 
      });
    }

    // Strip data URI prefix if present (e.g. data:application/pdf;base64,)
    let cleanBase64 = pdfBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }

    const prompt = `
You are an expert travel operations intelligence assistant for an international tour operator.
Analyze the attached tour itinerary PDF thoroughly. Extract and organize all travel knowledge into a structured JSON hierarchy:

1. "tourMeta":
   - "title": Title or name of the tour
   - "durationDays": Number of days (integer, e.g. 7)
   - "countries": List of country names visited
   - "summary": 2-3 sentence overview of the itinerary

2. "countries": Array of unique countries visited in the tour. For each country:
   - "id": 3-letter ISO code or uppercase slug (e.g. "JPN", "FRA", "THA", "CHE", "ITA")
   - "name": Full country name (e.g. "Japan")
   - "region": Geographical region (e.g. "East Asia", "Western Europe")
   - "currency": { "code": "JPY", "symbol": "¥", "name": "Japanese Yen", "cardUsage": "High / Moderate / Cash Preferred" }
   - "emergency": { "police": "110", "ambulance": "119", "embassyNote": "Emergency contact guidance" }
   - "powerPlugs": { "types": ["A", "B"], "voltage": "100V", "notes": "Requires 2-pin flat adapter" }
   - "visaInfo": { "requiresVisa": true, "type": "e-Visa / Visa-Free / Embassy Visa", "notes": "Passport validity min 6 months, SG Arrival card or Visit Japan Web QR code required" }
   - "customsEtiquette": { "dos": ["Take off shoes inside temples", "Stand on left on escalators in Tokyo"], "donts": ["No tipping in restaurants", "No loud phone calls on public transit"], "tippingNotes": "Tipping is not customary and may cause confusion" }
   - "waterSafety": "Tap water is safe to drink" or "Bottled water recommended"

3. "cities": Array of unique cities / regions visited. For each city:
   - "id": lowercase slug (e.g. "tokyo", "kyoto", "hakone")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "name": City name (e.g. "Kyoto")
   - "airports": Array of airport codes if relevant (e.g. ["HND", "NRT"] or ["KIX"])
   - "bestMonths": Array of best months to visit (e.g. ["Mar", "Apr", "Oct", "Nov"])
   - "transportApps": Recommended local apps (e.g. ["Suica / Pasmo", "Japan Travel by NAVITIME", "Go Taxi"])
   - "foodHighlights": { "signature": ["Matcha Parfait", "Kaiseki", "Yudofu"], "halalFriendly": "Moderate (Halal ramen spots available in Gion)" }
   - "hospitalContacts": Array of emergency tourist-friendly medical facilities (e.g. ["Kyoto University Hospital International Clinic"])

4. "tourObjects": Array of all specific tour attractions / points of interest / landmarks (POIs) visited throughout the tour days. For each object:
   - "id": lowercase slug (e.g. "fushimi-inari-shrine")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "cityName": city name (e.g. "Kyoto")
   - "name": Official attraction name (e.g. "Fushimi Inari Taisha Shrine")
   - "category": One of ["Historical", "Cultural", "Religious", "Nature", "Theme Park", "Shopping", "Museum", "Landmark", "Culinary"]
   - "estDurationMinutes": Estimated visit time in minutes (integer, e.g. 90)
   - "openingHours": { "open": "24 Hours" or "09:00", "close": "17:00", "notes": "Main shrine open 24/7, souvenir shops close at 17:30" }
   - "ticketPolicy": { "bookingMode": "Free Entry / Advance Ticket Required / Group Ticket at Gate", "notes": "No ticket required for shrine grounds" }
   - "dressCode": Dress guidelines (e.g. "Modest clothing recommended; comfortable walking shoes for mountain path")
   - "rules": { "photosAllowed": true, "tripodAllowed": false, "luggageStorage": true, "notes": "No flash or tripods on the torii path during peak hours" }
   - "guideBriefingNotes": Array of 3-4 bullet points for Tour Leaders to brief guests on the bus (history trivia, fun facts, meeting points, clean restroom locations)
   - "photoSpots": Array of 2-3 best photo location tips (e.g. ["Torii gate tunnel entrance", "Yotsutsuji intersection viewpoint"])

IMPORTANT: Respond ONLY with valid, parseable JSON matching this format without any introductory or conversational text.
`;

    // Attempt generation with Gemini 2.5 Flash
    let response;
    try {
      response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
    } catch (modelErr) {
      console.warn('Gemini 2.5 Flash attempt failed, retrying with fallback model...', modelErr.message);
      response = await aiClient.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: cleanBase64
            }
          },
          { text: prompt }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
    }

    const rawText = response.text;
    const parsedData = cleanJsonOutput(rawText);

    res.status(200).json({
      success: true,
      fileName: fileName || 'Itinerary.pdf',
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing itinerary PDF with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse itinerary PDF'
    });
  }
});

// 2. Generate or Enrich Destination Intelligence on-demand with AI
app.post('/api/knowledge/generate-destination-ai', async (req, res) => {
  try {
    const { query, type, context } = req.body;
    if (!query || !type) {
      return res.status(400).json({ success: false, error: 'query and type (country|city|object) are required.' });
    }

    if (!aiClient) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server.' 
      });
    }

    const prompt = `
You are a senior travel operations manager. Provide a comprehensive, accurate intelligence dossier for the following ${type}: "${query}".
${context ? `Additional Context: ${context}` : ''}

Return ONLY valid JSON matching the format for ${type}:
${type === 'country' ? `
{
  "id": "3-letter ISO code (e.g. JPN, CHE, FRA, THA)",
  "name": "Country Name",
  "region": "Continent/Region",
  "currency": { "code": "USD/EUR/JPY", "symbol": "$/€/¥", "name": "Currency Name", "cardUsage": "High / Moderate / Cash Preferred" },
  "emergency": { "police": "112/911/110", "ambulance": "112/911/119", "embassyNote": "Embassy details" },
  "powerPlugs": { "types": ["C", "F"], "voltage": "230V", "notes": "Plug type notes" },
  "visaInfo": { "requiresVisa": true/false, "type": "e-Visa / Visa Free", "notes": "Passport validity rules, arrival forms" },
  "customsEtiquette": { "dos": ["Do 1", "Do 2"], "donts": ["Don't 1", "Don't 2"], "tippingNotes": "Tipping etiquette" },
  "waterSafety": "Tap water safe / Bottled only"
}
` : type === 'city' ? `
{
  "id": "city-slug",
  "countryId": "ISO Country code",
  "countryName": "Country Name",
  "name": "City Name",
  "airports": ["Airport Codes"],
  "bestMonths": ["Best Months"],
  "transportApps": ["Metro apps, Taxi apps"],
  "foodHighlights": { "signature": ["Dish 1", "Dish 2"], "halalFriendly": "Halal/Dietary availability notes" },
  "hospitalContacts": ["Tourist-friendly medical centers"]
}
` : `
{
  "id": "object-slug",
  "countryId": "ISO Country code",
  "countryName": "Country Name",
  "cityName": "City Name",
  "name": "Attraction Name",
  "category": "Historical / Cultural / Religious / Nature / Theme Park / Shopping / Museum / Landmark",
  "estDurationMinutes": 90,
  "openingHours": { "open": "09:00", "close": "17:00", "notes": "Operating schedule notes" },
  "ticketPolicy": { "bookingMode": "Free / Advance Online / Group Desk", "notes": "Booking advice" },
  "dressCode": "Attire rules (e.g. modest dress, covered shoulders)",
  "rules": { "photosAllowed": true, "tripodAllowed": false, "luggageStorage": true, "notes": "Rules" },
  "guideBriefingNotes": ["Tour leader briefing point 1", "Tour leader briefing point 2", "Meeting point / Restroom tip"],
  "photoSpots": ["Best photography location 1", "Best photography location 2"]
}
`}
`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: { responseMimeType: 'application/json' }
    });

    const parsedData = cleanJsonOutput(response.text);
    res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error generating destination AI dossier:', error);
    res.status(500).json({ success: false, error: error.message || 'AI Generation failed' });
  }
});
app.post('/api/send-email', emailLimiter, async (req, res) => {
  const { to, subject, text, html, smtpConfig } = req.body;

  const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;
  const senderName = smtpConfig?.senderName || 'TravelOps System';

  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient email (to) is required.' });
  }

  // Verify that SMTP variables are provided
  if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_app_password') {
    console.error("[EMAIL ERROR] SMTP_USER or SMTP_PASS is missing or using placeholder values!");
    return res.status(400).json({ 
      success: false, 
      error: 'SMTP credentials missing. Please enter your valid SMTP Username/Email and Password in Settings.' 
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    await transporter.verify();

    const info = await transporter.sendMail({
      from: `"${senderName}" <${user}>`,
      to,
      subject: subject || 'TravelOps Test Email',
      text: text || 'This is a test email from TravelOps.',
      html: html || '<b>This is a test email from TravelOps.</b>'
    });

    console.log(`[EMAIL DISPATCH] Email successfully sent to ${to}. MessageID: ${info.messageId}`);
    return res.status(200).json({ 
      success: true, 
      message: `Email successfully delivered to ${to}! MessageID: ${info.messageId}` 
    });
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to dispatch email via SMTP server.' 
    });
  }
});


// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route to serve index.html for client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Run schema sync before starting the server
syncDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
