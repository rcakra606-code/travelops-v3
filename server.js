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

// Disable X-Powered-By header to prevent fingerprinting
app.disable('x-powered-by');

// Trust the first proxy (Railway load balancer) so express-rate-limit can accurately get IPs
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for React inline scripts compatibility if needed
  crossOriginEmbedderPolicy: false
}));

// Block vulnerability scanner probes and PHP probe requests (.php, .env, .git, wp-*, phpmyadmin, etc.)
app.use((req, res, next) => {
  const url = req.originalUrl.toLowerCase();
  if (
    url.endsWith('.php') ||
    url.includes('.php?') ||
    url.includes('/.env') ||
    url.includes('/.git') ||
    url.includes('/wp-') ||
    url.includes('phpmyadmin') ||
    url.includes('/cgi-bin/')
  ) {
    return res.status(404).send('Not Found');
  }
  next();
});

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

// Middleware (Restricted CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  process.env.APP_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, same-origin)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app') || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true
}));
app.use('/api/', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Google Gemini AI Client
let aiClient = null;
const getAiClient = () => {
  if (aiClient) return aiClient;
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (key) {
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
};
aiClient = getAiClient();

// Authentication & Role Authorization Middlewares
const requireAuth = async (req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session token.' });
    }
    req.authUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Session verification failed.' });
  }
};

const requireAdmin = async (req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authorization token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired session token.' });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('travelops_users')
      .select('id, role, status')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ success: false, error: 'Forbidden: User profile not found.' });
    }

    if (profile.status !== 'Active') {
      return res.status(403).json({ success: false, error: 'Forbidden: User account is inactive or locked.' });
    }

    if (profile.role !== 'Admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Administrative privileges required.' });
    }

    req.authUser = user;
    req.currentUser = profile;
    next();
  } catch (err) {
    console.error('requireAdmin error:', err);
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authorization failed.' });
  }
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
app.post('/api/admin/users', requireAdmin, async (req, res) => {
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
app.put('/api/admin/users/:id/password', requireAdmin, async (req, res) => {
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
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
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

// --- PUBLIC CLIENT TRACKING ENDPOINT ---
app.get('/api/public/track/:code', async (req, res) => {
  const { code } = req.params;
  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'Tracking code is required' });
  }

  // Sanitize tracking code to prevent filter injection (alphanumeric, dash, underscore, dot)
  const cleanCode = code.trim();
  const sanitizedCode = cleanCode.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  if (!sanitizedCode) {
    return res.status(400).json({ success: false, error: 'Invalid tracking code format' });
  }

  try {
    const client = supabaseAdmin || createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    // 1. Search in Documents (Visas / Passports)
    const { data: docs } = await client
      .from('travelops_documents')
      .select('*')
      .or(`booking_code.eq.${sanitizedCode},invoice_number.eq.${sanitizedCode},shipping_resi.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (docs && docs.length > 0) {
      const d = docs[0];
      return res.status(200).json({
        success: true,
        data: {
          type: 'document',
          id: d.id,
          docType: d.doc_type || 'Visa / Passport',
          guestName: d.guest_name,
          country: d.country,
          processType: d.process_type || 'Normal',
          receiveDate: d.receive_date,
          estimatedDone: d.estimated_done,
          sendDate: d.send_date,
          bookingCode: d.booking_code,
          invoiceNumber: d.invoice_number,
          shippingStatus: d.shipping_status || 'Processing',
          shippingMethod: d.shipping_method,
          shippingCourier: d.shipping_courier,
          shippingResi: d.shipping_resi,
          shippingNotes: d.shipping_notes,
          receivedStatus: d.received_status
        }
      });
    }

    // 2. Search in Tours
    const { data: tours } = await client
      .from('travelops_tours')
      .select('*')
      .or(`id.eq.${sanitizedCode}`)
      .limit(1);

    if (tours && tours.length > 0) {
      const t = tours[0];
      return res.status(200).json({
        success: true,
        data: {
          type: 'tour',
          id: t.id,
          tourCode: t.internals?.tourCode || t.id,
          bookingCode: t.internals?.bookingCode || t.id,
          country: t.country,
          category: t.category,
          departureDate: t.departure_date,
          returnDate: t.return_date,
          paxCount: t.internals?.paxCount || 1,
          status: t.status,
          paxList: (t.pax_info || []).map(p => ({ name: p.name, title: p.title }))
        }
      });
    }

    // 3. Search in Hotels
    const { data: hotels } = await client
      .from('travelops_hotels')
      .select('*')
      .or(`confirmation_number.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (hotels && hotels.length > 0) {
      const h = hotels[0];
      return res.status(200).json({
        success: true,
        data: {
          type: 'hotel',
          id: h.id,
          hotelName: h.hotel_name,
          region: h.region,
          checkIn: h.check_in,
          checkOut: h.check_out,
          roomType: h.room_type,
          confirmationNumber: h.confirmation_number,
          status: h.status
        }
      });
    }

    // 4. Search in Cruises
    const { data: cruises } = await client
      .from('travelops_cruises')
      .select('*')
      .or(`booking_ref.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (cruises && cruises.length > 0) {
      const c = cruises[0];
      return res.status(200).json({
        success: true,
        data: {
          type: 'cruise',
          id: c.id,
          shipName: c.ship_name,
          cruiseBrand: c.cruise_brand,
          bookingRef: c.booking_ref,
          sailingStart: c.sailing_start,
          sailingEnd: c.sailing_end,
          route: c.route,
          status: c.status
        }
      });
    }

    return res.status(404).json({
      success: false,
      error: `No records found for tracking reference "${sanitizedCode}"`
    });
  } catch (error) {
    console.error('Error in public tracking endpoint:', error);
    res.status(500).json({ success: false, error: 'Internal server error while searching records' });
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
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch (e) {}
    }
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch (e) {}
    }
    throw err;
  }
}

// Resilient model fallback executor for Gemini models
async function runWithModelFallback(runnerFn) {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;
  for (const model of models) {
    try {
      return await runnerFn(model);
    } catch (err) {
      lastError = err;
      console.warn(`[GEMINI FALLBACK] Model ${model} call failed (${err.message}). Trying next candidate...`);
    }
  }
  throw lastError || new Error('All Gemini models failed to process request');
}

// RAG Operational Grounding Retriever for TravelOps AI Copilot
async function getOperationalGrounding(message, currentPath) {
  const contextNotes = [];

  // 1. Determine module and operational context from current URL path
  const path = (currentPath || '').toLowerCase();
  let moduleContext = 'TravelOps General Operations (Ticketing, Customer Service, General Inquiries)';
  if (path.includes('/tour')) {
    moduleContext = 'Tour Management & Itinerary Planning (Focus: tour schedules, group pacing, driver hours, itinerary breakdown, FOC, margin calculation)';
  } else if (path.includes('/document')) {
    moduleContext = 'Document & Visa Operations (Focus: passport validity min 6 months, visa requirements for Indonesian passport holders, embassy appointments, biometrics, document completion tracking)';
  } else if (path.includes('/hotel')) {
    moduleContext = 'Hotel Reservations & Accommodations (Focus: group rates, rooming list formats, bed types Twin/Double, city tax, early check-in/late check-out, breakfast vouchers)';
  } else if (path.includes('/cruise')) {
    moduleContext = 'Cruise Bookings & Sea Packages (Focus: cabin categories, port taxes, gratuities, shore excursion timing, passenger manifest)';
  } else if (path.includes('/corporate')) {
    moduleContext = 'Corporate Accounts & MICE (Focus: B2B proposals, corporate travel policy adherence, RFP quotations, payment terms, attendee rosters)';
  } else if (path.includes('/knowledge') || path.includes('/destination')) {
    moduleContext = 'Destination Knowledge Base & Intelligence (Focus: plug/voltage standards, local currency & tipping etiquette, emergency numbers, cultural dos & donts)';
  }
  contextNotes.push(`[Active Screen / Module Context]: ${moduleContext}`);

  // 2. Query Supabase for destination intelligence grounding if relevant
  if (supabaseAdmin) {
    try {
      const msgLower = (message || '').toLowerCase();

      // Retrieve country intelligence if country is mentioned or relevant
      const { data: countries } = await supabaseAdmin
        .from('travelops_dest_countries')
        .select('name, general_info, currency, emergency, power_plugs, visa_info, customs_etiquette')
        .limit(25);

      if (countries && countries.length > 0) {
        const matchedCountries = countries.filter(c => 
          c.name && (msgLower.includes(c.name.toLowerCase()) || (c.id && msgLower.includes(c.id.toLowerCase())))
        );

        if (matchedCountries.length > 0) {
          contextNotes.push('\n[Verified Company Destination Knowledge (RAG)] :');
          for (const c of matchedCountries.slice(0, 3)) {
            const vInfo = typeof c.visa_info === 'object' ? JSON.stringify(c.visa_info) : c.visa_info;
            const plugInfo = typeof c.power_plugs === 'object' ? JSON.stringify(c.power_plugs) : c.power_plugs;
            const currInfo = typeof c.currency === 'object' ? JSON.stringify(c.currency) : c.currency;
            contextNotes.push(`• Country: ${c.name} | Visa: ${vInfo || 'Check requirements'} | Plugs: ${plugInfo || 'Standard'} | Currency: ${currInfo || 'Local'}`);
            if (c.general_info) {
              contextNotes.push(`  Overview: ${c.general_info}`);
            }
          }
        }
      }

      // Ground with tour routes if query relates to itineraries, routes, or tour planning
      if (
        msgLower.includes('itinerary') || 
        msgLower.includes('rute') || 
        msgLower.includes('tour') || 
        msgLower.includes('paket') || 
        msgLower.includes('hari') ||
        path.includes('/tour')
      ) {
        const { data: routes } = await supabaseAdmin
          .from('travelops_tour_routes')
          .select('title, country_name, duration_days, duration_nights, cities_sequence, route_highlights')
          .limit(10);

        if (routes && routes.length > 0) {
          const relevantRoutes = routes.filter(r => 
            (r.country_name && msgLower.includes(r.country_name.toLowerCase())) ||
            (r.title && msgLower.includes(r.title.toLowerCase()))
          );
          const pool = relevantRoutes.length > 0 ? relevantRoutes : routes.slice(0, 3);
          contextNotes.push('\n[Company Master Tour Routes Reference]:');
          for (const r of pool.slice(0, 3)) {
            const cities = Array.isArray(r.cities_sequence) ? r.cities_sequence.join(' ➔ ') : r.cities_sequence;
            contextNotes.push(`• Route: "${r.title}" (${r.duration_days}D${r.duration_nights}N in ${r.country_name || 'Destination'}) | Cities: ${cities || '-'}`);
          }
        }
      }
    } catch (dbErr) {
      console.warn('[Copilot RAG Grounding] Non-blocking DB fetch warning:', dbErr.message);
    }
  }

  return contextNotes.join('\n');
}

// 1. Parse Tour Itinerary PDF with Gemini Multimodal
app.post('/api/knowledge/parse-itinerary-pdf', requireAuth, async (req, res) => {
  try {
    const { pdfBase64, fileName, prompt: customPrompt } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ success: false, error: 'pdfBase64 is required in request body.' });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server. Please check your .env configuration.' 
      });
    }

    // Strip data URI prefix if present and remove any formatting whitespace
    let cleanBase64 = pdfBase64;
    if (cleanBase64.includes('base64,')) {
      cleanBase64 = cleanBase64.split('base64,')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s+/g, '');

    // Validate PDF magic bytes: Base64 for "%PDF" starts with "JVBERi"
    if (!cleanBase64.startsWith('JVBERi')) {
      return res.status(400).json({
        success: false,
        error: 'Security Error: Uploaded payload is not a valid PDF file.'
      });
    }

    // Sanitize fileName to prevent directory traversal or script extensions
    const cleanFileName = (fileName || 'Itinerary.pdf')
      .replace(/[^a-zA-Z0-9_\-\. ]/g, '')
      .trim();

    const prompt = customPrompt || `
You are an expert travel operations intelligence assistant for an international tour operator.
Analyze the attached tour itinerary PDF thoroughly. Extract and organize all travel knowledge AND the complete tour route into a structured JSON hierarchy with concise general information overviews:

1. "tourMeta":
   - "title": Title or official name of the tour (e.g. "7D6N Classic Japan Golden Route")
   - "durationDays": Total days (integer, e.g. 7)
   - "durationNights": Total nights (integer, e.g. 6)
   - "countries": List of country names visited
   - "summary": 2-3 sentence overview of the itinerary

2. "tourRoute": Full captured itinerary route data:
   - "title": Tour Route Title (e.g. "7D6N Golden Route Tokyo Fuji Kyoto Osaka")
   - "generalInfo": Crisp 1-2 sentence executive summary of the journey flow and unique value proposition.
   - "countryId": 3-letter ISO code (e.g. "JPN")
   - "countryName": Country Name (e.g. "Japan")
   - "durationDays": integer (e.g. 7)
   - "durationNights": integer (e.g. 6)
   - "citiesSequence": Sequence of cities visited in order, e.g. ["Tokyo", "Hakone", "Kyoto", "Osaka"]
   - "themeCategory": One of ["Leisure", "Cultural", "Nature & Scenic", "Winter & Ski", "Luxury", "Adventure", "Family", "Shopping & Culinary"]
   - "transportModes": e.g. ["Private Coach", "Bullet Train (Shinkansen)"]
   - "routeHighlights": Top 4-5 journey highlights
   - "dayItinerary": Array of daily schedules:
     [
       {
         "day": 1,
         "title": "Arrival in Tokyo - City Orientation",
         "city": "Tokyo",
         "objects": ["Tokyo Tower", "Shinjuku"],
         "meals": { "b": false, "l": true, "d": true },
         "hotelArea": "Tokyo Bay / Shinjuku",
         "summary": "Morning arrival at Haneda/Narita airport, transfer to hotel and orientation."
       }
     ]

3. "countries": Array of unique countries visited in the tour. For each country:
   - "id": 3-letter ISO code (e.g. "JPN", "FRA", "THA", "CHE", "ITA")
   - "name": Full country name (e.g. "Japan")
   - "region": Geographical region (e.g. "East Asia", "Western Europe")
   - "generalInfo": Concise 1-2 sentence general country overview (climate, vibe, and travel character).
   - "currency": { "code": "JPY", "symbol": "¥", "name": "Japanese Yen", "cardUsage": "High / Moderate / Cash Preferred" }
   - "emergency": { "police": "110", "ambulance": "119", "embassyNote": "Emergency contact guidance" }
   - "powerPlugs": { "types": ["A", "B"], "voltage": "100V", "notes": "Requires 2-pin flat adapter" }
   - "visaInfo": { "requiresVisa": true, "type": "e-Visa / Visa-Free", "notes": "Passport validity rules" }
   - "customsEtiquette": { "dos": ["Do 1", "Do 2"], "donts": ["Don't 1", "Don't 2"], "tippingNotes": "Tipping advice" }
   - "waterSafety": "Tap water is safe to drink / Bottled water recommended"

4. "cities": Array of unique cities / regions visited. For each city:
   - "id": lowercase slug (e.g. "tokyo", "kyoto", "hakone")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "name": City name (e.g. "Kyoto")
   - "generalInfo": Concise 1-2 sentence city overview highlighting its vibe and role in the tour.
   - "airports": Array of airport codes if relevant (e.g. ["HND", "NRT"])
   - "bestMonths": Array of best months to visit
   - "transportApps": Recommended local apps (e.g. ["Suica", "Go Taxi"])
   - "foodHighlights": { "signature": ["Signature dishes"], "halalFriendly": "Halal notes" }
   - "hospitalContacts": Array of tourist-friendly hospitals

5. "tourObjects": Array of all specific tour attractions / points of interest / landmarks (POIs) visited throughout the tour days. For each object:
   - "id": lowercase slug (e.g. "fushimi-inari-shrine")
   - "countryId": matching country id (e.g. "JPN")
   - "countryName": country name (e.g. "Japan")
   - "cityName": city name (e.g. "Kyoto")
   - "name": Official attraction name (e.g. "Fushimi Inari Taisha Shrine")
   - "generalInfo": Concise 1-2 sentence overview of the attraction's significance and visitor appeal.
   - "category": One of ["Historical", "Cultural", "Religious", "Nature", "Theme Park", "Shopping", "Museum", "Landmark", "Culinary"]
   - "estDurationMinutes": Estimated visit time in minutes (integer, e.g. 90)
   - "openingHours": { "open": "09:00", "close": "17:00", "notes": "Hours notes" }
   - "ticketPolicy": { "bookingMode": "Free Entry / Advance Ticket / Group Desk", "notes": "Ticket notes" }
   - "dressCode": Dress guidelines
   - "rules": { "photosAllowed": true, "tripodAllowed": false, "luggageStorage": true, "notes": "Rules" }
   - "guideBriefingNotes": Array of 3-4 bullet points for Tour Leaders to brief guests on the bus
   - "photoSpots": Array of 2-3 best photo location tips

IMPORTANT: Respond ONLY with valid, parseable JSON matching this format without any introductory or commentary text.
`;

    const response = await runWithModelFallback(async (model) => {
      return await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: cleanBase64
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
    });

    const rawText = response.text;
    const parsedData = cleanJsonOutput(rawText);

    res.status(200).json({
      success: true,
      fileName: cleanFileName.endsWith('.pdf') ? cleanFileName : `${cleanFileName}.pdf`,
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
app.post('/api/knowledge/generate-destination-ai', requireAuth, async (req, res) => {
  try {
    const { query, type, context } = req.body;
    if (!query || !type) {
      return res.status(400).json({ success: false, error: 'query and type (country|city|object) are required.' });
    }

    const client = getAiClient();
    if (!client) {
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
  "generalInfo": "Crisp 1-2 sentence executive overview of the country for tour operators.",
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
  "generalInfo": "Crisp 1-2 sentence overview highlighting its role in tourism.",
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
  "generalInfo": "Crisp 1-2 sentence overview of the attraction's historic/cultural significance.",
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

    const response = await runWithModelFallback(async (model) => {
      return await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
    });

    const parsedData = cleanJsonOutput(response.text);
    res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error generating destination AI dossier:', error);
    res.status(500).json({ success: false, error: error.message || 'AI Generation failed' });
  }
});

// 2b. Audit Destination Entity Freshness with AI
app.post('/api/knowledge/audit-entity', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required.' });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const response = await runWithModelFallback(async (model) => {
      return await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });
    });

    const parsedData = cleanJsonOutput(response.text);
    res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error auditing destination entity:', error);
    res.status(500).json({ success: false, error: error.message || 'Audit failed' });
  }
});

// 3. AI Operations Copilot Assistant (Proxied for security, protects API key, RAG grounded)
app.post('/api/ai/copilot-chat', requireAuth, async (req, res) => {
  try {
    const { message, history, userContext, currentPath } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server. Please check server environment variables.' 
      });
    }

    // 1. Retrieve RAG database facts and current workspace context
    const groundingContext = await getOperationalGrounding(message, currentPath);

    const systemPrompt = `You are the "TravelOps AI Operations Copilot", a senior travel operations manager, master itinerary architect, and professional travel communications specialist built inside the TravelOps travel agency ERP platform.

CORE CAPABILITIES & OBJECTIVES:
1. Destination Intelligence & Logistics: Visa policies for Indonesian passport holders (Schengen, Japan e-Visa/sticker, UK, US, Korea K-ETA, Australia eVisitor, China, Turkey, Saudi Umrah/Tourist), 6-month passport validity rules, electrical plug/voltage standards, currency & payment methods (cash vs card/Suica/travel cards), local tipping customs, emergency services, and halal/Muslim-friendly dining guidance.
2. Itinerary Planning & Operational Feasibility: Day-by-day tour programs, transit and buffer timings, bus driver regulations (e.g. EU 9-hour daily driving limits), sightseeing sequence, optimal hotel locations, and seasonal packing advisories.
3. Commercial & Agency Operations: Group pricing calculations, Single Supplement logic, FOC (Free of Charge) tour leader ratios (e.g. 15+1 FOC, 20+1 FOC), rooming list allocations (Twin, Double, Triple, CWB, CNB), and supplier coordination.
4. Client-Ready Communications: Drafting professional WhatsApp broadcasts, booking confirmations, payment reminders (DP, second payment, final balance H-14/H-7), flight departure notifications, and tour leader daily briefing sheets.

COMMUNICATION TONE & FORMATTING RULES:
- Professional, polite, highly articulate, and helpful. If queried in Indonesian, respond in natural, professional Indonesian travel industry terminology (e.g., pax, land arrangement, rooming list, tipping guide/driver, itinerary, flight manifest).
- Format your response with clean bold headers, concise bullet points, and appropriate emojis so it is effortless to scan.
- When generating messages for clients, ensure the tone is warm and professional ("Selamat pagi/siang Bapak/Ibu..."), with clear key details (Dates, Amounts, Bank Accounts, Deadlines) and placeholder signatures.`;

    const contents = [];
    if (Array.isArray(history)) {
      const validHistory = history.slice(-6);
      for (const h of validHistory) {
        if (h.content && (h.role === 'user' || h.role === 'assistant')) {
          contents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
          });
        }
      }
    }

    const operatorName = userContext?.name || req.authUser?.email || 'Operations Staff';
    const operatorRole = userContext?.role || 'Travel Consultant';

    const promptWithContext = `${systemPrompt}

---
[ACTIVE OPERATOR PROFILE]
Name: ${operatorName}
Role: ${operatorRole}
Current Module / Screen: ${currentPath || '/dashboard'}

${groundingContext}
---

[OPERATOR QUERY]
${message.trim()}

Provide a structured, accurate, and actionable response based on the above operational context.`;

    contents.push({
      role: 'user',
      parts: [{ text: promptWithContext }]
    });

    const response = await runWithModelFallback(async (model) => {
      return await client.models.generateContent({
        model,
        contents,
        config: {
          temperature: 0.65,
          maxOutputTokens: 2048
        }
      });
    });

    const replyText = response?.text;
    if (!replyText) {
      throw new Error('No text generated by Gemini.');
    }

    res.status(200).json({ 
      success: true, 
      text: replyText,
      grounded: Boolean(groundingContext && groundingContext.includes('[Verified Company'))
    });
  } catch (error) {
    console.error('Error in copilot-chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response from AI Copilot.'
    });
  }
});

// Server-side in-memory dispatch tracker to prevent duplicate reminder emails per day
const dailyRemindersDispatched = new Map();

app.post('/api/send-email', requireAuth, emailLimiter, async (req, res) => {
  const { to, subject, text, html, smtpConfig, category } = req.body;

  const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;
  const senderName = smtpConfig?.senderName || 'TravelOps System';

  if (!to) {
    return res.status(400).json({ success: false, error: 'Recipient email (to) is required.' });
  }

  // Idempotency guard: prevent duplicate automated daily reminder emails per calendar day per category
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const catKey = category || 'general';
  const dispatchKey = `${catKey}_${to.toLowerCase().trim()}_${todayStr}`;

  if ((category === 'daily_reminder' || category === 'daily_operational_reminder' || category === 'daily_admin_reminder') && dailyRemindersDispatched.has(dispatchKey)) {
    console.log(`[EMAIL DISPATCH] Daily reminder (${category}) already sent to ${to} today (${todayStr}). Skipping duplicate.`);
    return res.status(200).json({ 
      success: true, 
      skipped: true, 
      message: `Daily reminder (${category}) already delivered to ${to} today (${todayStr}). Skipped to prevent spam.` 
    });
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

    if (category === 'daily_reminder' || category === 'daily_operational_reminder' || category === 'daily_admin_reminder') {
      dailyRemindersDispatched.set(dispatchKey, Date.now());
    }

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
