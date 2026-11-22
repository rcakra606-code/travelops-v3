import express from 'express';
import * as Sentry from '@sentry/node';
import compression from 'compression';
import cors from 'cors';
import crypto from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import { syncDatabase } from './scripts/db-sync.js';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { logger, httpLogger } from './server/logger.js';
import {
  cacheGet,
  cacheSet,
  createRateLimitStore,
  getCacheStatus
} from './server/cache.js';
import {
  dispatchTransactionalEmail,
  getMailerStatus
} from './server/mailer.js';
import {
  getHybridOperationalGrounding,
  backfillKnowledgeEmbeddings
} from './server/rag.js';
import { runServerDailyReminders } from './server/dailyReminderRunner.js';
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  sendEmailSchema,
  copilotChatSchema,
  generateDestinationSchema,
  auditEntitySchema,
  parseItineraryPdfSchema,
  parseFormFileSchema,
  biInsightsSchema,
  parseCorporateExcelSchema,
  parseFlightReservationSchema,
  validateBody
} from './src/schemas/apiSchemas.js';
import {
  validateCorporateExcelPayload,
  buildCorporateExcelPrompt
} from './src/utils/corporateAiPrompt.js';
import {
  validateFlightReservationPayload,
  buildFlightReservationPrompt
} from './src/utils/flightReservationPrompt.js';
import {
  validateRegistrationFilePayload,
  buildTourRegistrationPrompt
} from './src/utils/tourRegistrationPrompt.js';
import {
  validateDocumentFilePayload,
  buildDocumentRequestPrompt
} from './src/utils/documentAiPrompt.js';
import {
  validateBiSnapshotPayload,
  buildBiAnalystPrompt,
  normalizeBiAiResponse
} from './src/utils/biAiPrompt.js';
import {
  cleanJsonOutput,
  buildGeminiJsonConfig,
  buildGeminiChatConfig
} from './src/utils/aiJsonHelpers.js';

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

// Structured HTTP request logging for /api/* routes (Pino)
app.use(httpLogger);

// Dynamic response compression (Gzip / Deflate for API JSON & dynamic responses)
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    }
  })
);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for React inline scripts compatibility if needed
  crossOriginEmbedderPolicy: false
}));

// Block vulnerability scanner probes, source maps, and PHP probe requests (.php, .map, .env, .git, wp-*, phpmyadmin, etc.)
app.use((req, res, next) => {
  const url = req.originalUrl.toLowerCase();
  if (
    url.endsWith('.php') ||
    url.includes('.php?') ||
    url.endsWith('.map') ||
    url.includes('.map?') ||
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

// Rate Limiting (General — uses Upstash Redis when configured, MemoryStore fallback otherwise)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: createRateLimitStore('api'),
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Rate Limiting (Strict for Email API)
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15, // Limit each IP to 15 emails per hour
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: createRateLimitStore('email'),
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
  } catch {
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

// --- HEALTH & READINESS ENDPOINT ---
app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'ok',
    service: 'travelops-v4',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    integrations: {
      supabaseAdmin: Boolean(supabaseAdmin),
      geminiAi: Boolean(getAiClient()),
      cache: getCacheStatus(),
      mailer: getMailerStatus()
    }
  });
});

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
app.post('/api/admin/users', requireAdmin, validateBody(createUserSchema), async (req, res) => {
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
app.put('/api/admin/users/:id/password', requireAdmin, validateBody(resetPasswordSchema), async (req, res) => {
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

// Update User Profile & Privileges (Admin Only)
app.put('/api/admin/users/:id', requireAdmin, validateBody(updateUserSchema), async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status, is_locked, isLocked, must_change_password, mustChangePassword } = req.body;

  try {
    const dbUpdates = {};
    if (name !== undefined) dbUpdates.name = name;
    if (role !== undefined) dbUpdates.role = role;
    if (status !== undefined) dbUpdates.status = status;
    if (is_locked !== undefined) dbUpdates.is_locked = is_locked;
    if (isLocked !== undefined) dbUpdates.is_locked = isLocked;
    if (must_change_password !== undefined) dbUpdates.must_change_password = must_change_password;
    if (mustChangePassword !== undefined) dbUpdates.must_change_password = mustChangePassword;

    // If email is being changed, update auth user first
    if (email) {
      dbUpdates.email = email;
      try {
        await supabaseAdmin.auth.admin.updateUserById(id, { email });
      } catch (authErr) {
        console.warn(`[Admin User Update] Supabase Auth email update notice: ${authErr.message}`);
      }
    }

    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid update fields provided.' });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('travelops_users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
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
  const sanitizedCode = cleanCode.replace(/[^a-zA-Z0-9_.-]/g, '');
  if (!sanitizedCode) {
    return res.status(400).json({ success: false, error: 'Invalid tracking code format' });
  }

  try {
    const cacheKey = `track:${sanitizedCode.toLowerCase()}`;
    const cachedRecord = await cacheGet(cacheKey);
    if (cachedRecord) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ success: true, data: cachedRecord });
    }
    res.setHeader('X-Cache', 'MISS');

    const client = supabaseAdmin || createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);

    // 1. Search in Documents (Visas / Passports)
    const { data: docs } = await client
      .from('travelops_documents')
      .select('*')
      .or(`booking_code.eq.${sanitizedCode},invoice_number.eq.${sanitizedCode},shipping_resi.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (docs && docs.length > 0) {
      const d = docs[0];
      const payload = {
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
      };
      await cacheSet(cacheKey, payload, 45);
      return res.status(200).json({ success: true, data: payload });
    }

    // 2. Search in Tours
    const { data: tours } = await client
      .from('travelops_tours')
      .select('*')
      .or(`id.eq.${sanitizedCode},internals->>bookingCode.eq.${sanitizedCode},internals->>tourCode.eq.${sanitizedCode}`)
      .limit(1);

    if (tours && tours.length > 0) {
      const t = tours[0];
      const payload = {
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
      };
      await cacheSet(cacheKey, payload, 45);
      return res.status(200).json({ success: true, data: payload });
    }

    // 3. Search in Hotels
    const { data: hotels } = await client
      .from('travelops_hotels')
      .select('*')
      .or(`confirmation_number.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (hotels && hotels.length > 0) {
      const h = hotels[0];
      const payload = {
        type: 'hotel',
        id: h.id,
        hotelName: h.hotel_name,
        region: h.region,
        checkIn: h.check_in,
        checkOut: h.check_out,
        roomType: h.room_type,
        confirmationNumber: h.confirmation_number,
        status: h.status
      };
      await cacheSet(cacheKey, payload, 45);
      return res.status(200).json({ success: true, data: payload });
    }

    // 4. Search in Cruises
    const { data: cruises } = await client
      .from('travelops_cruises')
      .select('*')
      .or(`booking_ref.eq.${sanitizedCode},id.eq.${sanitizedCode}`)
      .limit(1);

    if (cruises && cruises.length > 0) {
      const c = cruises[0];
      const payload = {
        type: 'cruise',
        id: c.id,
        shipName: c.ship_name,
        cruiseBrand: c.cruise_brand,
        bookingRef: c.booking_ref,
        sailingStart: c.sailing_start,
        sailingEnd: c.sailing_end,
        route: c.route,
        status: c.status
      };
      await cacheSet(cacheKey, payload, 45);
      return res.status(200).json({ success: true, data: payload });
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

// 1. Parse Tour Itinerary PDF with Gemini Multimodal
app.post('/api/knowledge/parse-itinerary-pdf', requireAuth, validateBody(parseItineraryPdfSchema), async (req, res) => {
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
      .replace(/[^a-zA-Z0-9_.\- ]/g, '')
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

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
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
        config: buildGeminiJsonConfig(model, { temperature: 0.1 })
      });
      return cleanJsonOutput(response.text);
    });

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

// 1b. Parse Tour Registration Form (PDF / Image) into TourWizard Draft via Gemini Multimodal
app.post('/api/tours/parse-registration-form', requireAuth, validateBody(parseFormFileSchema), async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, staffList } = req.body || {};

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum terkonfigurasi di server. Harap cek environment variables.'
      });
    }

    const validation = validateRegistrationFilePayload(fileBase64, mimeType);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const cleanFileName = (fileName || 'Formulir_Pendaftaran.pdf')
      .replace(/[^a-zA-Z0-9_\-. ]/g, '')
      .trim();

    const prompt = buildTourRegistrationPrompt(Array.isArray(staffList) ? staffList : []);

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: validation.mimeType,
                  data: validation.cleanBase64
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: buildGeminiJsonConfig(model, { temperature: 0.1 })
      });
      const parsed = cleanJsonOutput(response.text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI tidak dapat mengekstrak data terstruktur dari dokumen ini.');
      }
      return parsed;
    });

    res.status(200).json({
      success: true,
      fileName: cleanFileName,
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing tour registration form with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memproses Formulir Pendaftaran dengan AI.'
    });
  }
});

// 1c. Parse Visa / Document Request Form (Lark PDF / Image) into Document Draft(s) via Gemini Multimodal
app.post('/api/documents/parse-request-form', requireAuth, validateBody(parseFormFileSchema), async (req, res) => {
  try {
    const { fileBase64, mimeType, fileName, staffList } = req.body || {};

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum terkonfigurasi di server. Harap cek environment variables.'
      });
    }

    const validation = validateDocumentFilePayload(fileBase64, mimeType);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    const cleanFileName = (fileName || 'Request_Visa_Document.pdf')
      .replace(/[^a-zA-Z0-9_\-. ]/g, '')
      .trim();

    const prompt = buildDocumentRequestPrompt(Array.isArray(staffList) ? staffList : []);

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: validation.mimeType,
                  data: validation.cleanBase64
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: buildGeminiJsonConfig(model, { temperature: 0.1 })
      });
      const parsed = cleanJsonOutput(response.text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI tidak dapat mengekstrak data terstruktur dari dokumen ini.');
      }
      return parsed;
    });

    res.status(200).json({
      success: true,
      fileName: cleanFileName,
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing document request form with Gemini:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memproses Formulir Request Dokumen dengan AI.'
    });
  }
});

// 2. Generate or Enrich Destination Intelligence on-demand with AI
app.post('/api/knowledge/generate-destination-ai', requireAuth, validateBody(generateDestinationSchema), async (req, res) => {
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

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: buildGeminiJsonConfig(model, { temperature: 0.2 })
      });
      return cleanJsonOutput(response.text);
    });

    res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error generating destination AI dossier:', error);
    res.status(500).json({ success: false, error: error.message || 'AI Generation failed' });
  }
});

// 2b. Audit Destination Entity Freshness with AI
app.post('/api/knowledge/audit-entity', requireAuth, validateBody(auditEntitySchema), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'prompt is required.' });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured on the server.' });
    }

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: buildGeminiJsonConfig(model, { temperature: 0.2 })
      });
      return cleanJsonOutput(response.text);
    });

    res.status(200).json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error auditing destination entity:', error);
    res.status(500).json({ success: false, error: error.message || 'Audit failed' });
  }
});

// 3. AI Operations Copilot Assistant (Proxied for security, protects API key, Hybrid pgvector + pg_trgm RAG)
app.post('/api/ai/copilot-chat', requireAuth, validateBody(copilotChatSchema), async (req, res) => {
  try {
    const { message, history, userContext, currentPath } = req.body;

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: 'GEMINI_API_KEY is not configured on the server. Please check server environment variables.' 
      });
    }

    // 1. Retrieve Hybrid RAG (pgvector + pg_trgm + cache) database facts and workspace context
    const { contextText: groundingContext, grounded } = await getHybridOperationalGrounding({
      supabaseAdmin,
      aiClient: client,
      message,
      currentPath
    });

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
        config: buildGeminiChatConfig(model, {
          temperature: 0.65,
          maxOutputTokens: 4096
        })
      });
    });

    const replyText = response?.text;
    if (!replyText) {
      throw new Error('No text generated by Gemini.');
    }

    res.status(200).json({ 
      success: true, 
      text: replyText,
      grounded
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Error in copilot-chat endpoint');
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response from AI Copilot.'
    });
  }
});

// 3b. Enterprise Business Intelligence AI Analyst (PII-Free Aggregated KPIs -> Structured 7-Element JSON, Cached 5m)
app.post('/api/bi/generate-insights', requireAuth, validateBody(biInsightsSchema), async (req, res) => {
  try {
    const { snapshot } = req.body || {};
    const validation = validateBiSnapshotPayload(snapshot);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const snapshotHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot))
      .digest('hex')
      .slice(0, 24);
    const cacheKey = `bi:insights:${snapshotHash}`;
    const cachedInsights = await cacheGet(cacheKey);
    if (cachedInsights) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json({ success: true, cached: true, data: cachedInsights });
    }
    res.setHeader('X-Cache', 'MISS');

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum terkonfigurasi di server. Harap cek environment variables.'
      });
    }

    const prompt = buildBiAnalystPrompt(snapshot);
    const normalized = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: buildGeminiJsonConfig(model, {
          temperature: 0.2,
          maxOutputTokens: 8192
        })
      });
      const parsedData = cleanJsonOutput(response.text);
      return normalizeBiAiResponse(parsedData);
    });

    await cacheSet(cacheKey, normalized, 300);

    res.status(200).json({
      success: true,
      data: normalized
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Error generating BI insights with Gemini');
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal menghasilkan analisis AI Business Intelligence.'
    });
  }
});

// 3c. AI Corporate Accounts Excel / CSV Schema Mapper & Form Extractor
app.post('/api/corporate/parse-accounts-excel', requireAuth, validateBody(parseCorporateExcelSchema), async (req, res) => {
  try {
    const validation = validateCorporateExcelPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum terkonfigurasi di server. Harap cek environment variables.'
      });
    }

    const cleanFileName = (req.body.fileName || 'Corporate_Accounts.xlsx')
      .replace(/[^a-zA-Z0-9_.\- ]/g, '')
      .trim();

    const prompt = buildCorporateExcelPrompt({
      sheetName: validation.sheetName,
      fileName: cleanFileName,
      totalRows: validation.totalRows,
      previewRows: validation.previewRows
    });

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: buildGeminiJsonConfig(model, {
          temperature: 0.1,
          maxOutputTokens: 8192
        })
      });
      const parsed = cleanJsonOutput(response.text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI tidak dapat memetakan struktur Excel akun corporate.');
      }
      return parsed;
    });

    res.status(200).json({
      success: true,
      fileName: cleanFileName,
      sheetName: validation.sheetName,
      data: parsedData
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Error parsing corporate accounts Excel with Gemini');
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memproses file Excel Akun Corporate dengan AI.'
    });
  }
});

// 3d. AI Flight Ticket Reservation Parser (Screenshot / PDF / Pure GDS Text)
app.post('/api/flights/parse-reservation', requireAuth, validateBody(parseFlightReservationSchema), async (req, res) => {
  try {
    const validation = validateFlightReservationPayload(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const client = getAiClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        error: 'GEMINI_API_KEY belum terkonfigurasi di server. Harap cek environment variables.'
      });
    }

    const prompt = buildFlightReservationPrompt({
      textInput: validation.textInput
    });

    const parts = [];
    if (validation.hasFile) {
      parts.push({
        inlineData: {
          mimeType: validation.mimeType,
          data: validation.cleanBase64
        }
      });
    }
    parts.push({ text: prompt });

    const parsedData = await runWithModelFallback(async (model) => {
      const response = await client.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: buildGeminiJsonConfig(model, {
          temperature: 0.1,
          maxOutputTokens: 8192
        })
      });
      const parsed = cleanJsonOutput(response.text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('AI tidak dapat mengekstrak jadwal penerbangan dari data yang diberikan.');
      }
      return parsed;
    });

    res.status(200).json({
      success: true,
      fileName: validation.fileName || undefined,
      data: parsedData
    });
  } catch (error) {
    logger.error({ err: error.message }, 'Error parsing flight reservation with Gemini');
    res.status(500).json({
      success: false,
      error: error.message || 'Gagal memproses data reservasi tiket pesawat dengan AI.'
    });
  }
});

// 4. Transactional Email Dispatch (Resend HTTP API primary + Pooled SMTP fallback + DB Idempotency)
app.post('/api/send-email', requireAuth, emailLimiter, validateBody(sendEmailSchema), async (req, res) => {
  const { to, subject, text, html, smtpConfig, category } = req.body;

  try {
    const result = await dispatchTransactionalEmail({
      to,
      subject,
      text,
      html,
      smtpConfig,
      category,
      supabaseAdmin
    });
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = Number(error?.statusCode || 500);
    logger.error({ err: error.message, to, category }, 'Failed to dispatch transactional email');
    return res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to dispatch email.'
    });
  }
});

// 5. Server-Side Daily Reminders Cron Endpoint (Triggered via Supabase pg_cron + pg_net or Admin)
const requireCronOrAdmin = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  const incomingSecret = req.headers['x-cron-secret'];
  if (cronSecret && incomingSecret && incomingSecret === cronSecret) {
    return next();
  }
  return requireAdmin(req, res, next);
};

app.post('/api/cron/daily-reminders', requireCronOrAdmin, async (req, res) => {
  try {
    const overrideRecipient = req.body?.recipient || '';
    const summary = await runServerDailyReminders({ supabaseAdmin, overrideRecipient });
    return res.status(200).json(summary);
  } catch (error) {
    logger.error({ err: error.message }, 'Server daily reminders cron failed');
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Admin pgvector Embedding Backfill Endpoint for Knowledge Base
app.post('/api/admin/knowledge/backfill-embeddings', requireAdmin, async (req, res) => {
  try {
    const client = getAiClient();
    if (!client) {
      return res.status(500).json({ success: false, error: 'GEMINI_API_KEY is not configured.' });
    }
    const limitPerTable = Math.min(100, Math.max(1, Number(req.body?.limitPerTable) || 50));
    const summary = await backfillKnowledgeEmbeddings({
      supabaseAdmin,
      aiClient: client,
      limitPerTable
    });
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    logger.error({ err: error.message }, 'Knowledge Base embedding backfill failed');
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Serve pre-compressed Brotli (.br) / Gzip (.gz) Vite build assets with immutable cache headers
const distDir = path.join(__dirname, 'dist');
const STATIC_MIME_TYPES = {
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm'
};

app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if (req.path.startsWith('/api/') || req.path.endsWith('.map')) return next();

  const ext = path.extname(req.path).toLowerCase();
  const contentType = STATIC_MIME_TYPES[ext];
  if (!contentType) return next();

  const acceptEncoding = String(req.headers['accept-encoding'] || '');
  const relativePath = req.path.replace(/^\/+/, '');
  const resolvedBase = path.resolve(distDir, relativePath);
  if (!resolvedBase.startsWith(distDir)) return next();

  const tryServeEncoded = (suffix, encoding) => {
    const encodedPath = `${resolvedBase}${suffix}`;
    if (!fs.existsSync(encodedPath)) return false;
    req.url = `${req.path}${suffix}`;
    res.setHeader('Content-Encoding', encoding);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Vary', 'Accept-Encoding');
    return true;
  };

  if (acceptEncoding.includes('br') && tryServeEncoded('.br', 'br')) {
    return next();
  }
  if (acceptEncoding.includes('gzip') && tryServeEncoded('.gz', 'gzip')) {
    return next();
  }
  return next();
});

app.use(
  express.static(distDir, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      const normalized = filePath.replace(/\\/g, '/');
      if (normalized.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (
        normalized.endsWith('/index.html') ||
        normalized.endsWith('/sw.js') ||
        normalized.endsWith('/registerSW.js') ||
        normalized.endsWith('/manifest.json') ||
        normalized.endsWith('/sw.js.br') ||
        normalized.endsWith('/sw.js.gz')
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    }
  })
);

// Catch-all route to serve index.html for client-side routing
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distDir, 'index.html'));
});

// Sentry Express error handler (must come after all routes/controllers and before custom error middleware)
Sentry.setupExpressErrorHandler(app);

app.use((err, req, res, _next) => {
  const status = Number(err?.status || err?.statusCode || 500);
  if (res.headersSent) return;
  logger.error({ err: err?.message, status, path: req.originalUrl }, 'Unhandled Express error');
  res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err?.message || 'Internal Server Error',
    sentryEventId: res.sentry || undefined
  });
});

// Run schema sync before starting the server
syncDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(
      {
        port: PORT,
        cache: getCacheStatus(),
        mailer: getMailerStatus()
      },
      `TravelOps server is running on port ${PORT}`
    );
  });
});
