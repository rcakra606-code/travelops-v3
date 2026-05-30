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
app.use(express.json());

// Require Supabase Admin middleware
const requireSupabaseAdmin = (req, res, next) => {
  if (!supabaseAdmin) {
    return res.status(500).json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server.' });
  }
  next();
};

// --- API ENDPOINTS FOR USER MANAGEMENT ---

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

    if (authError) throw authError;

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});


// API Route for sending emails
app.post('/api/send-email', emailLimiter, (req, res) => {
  const { to, subject, text, html } = req.body;

  // Verify that SMTP variables are actually loaded
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[EMAIL ERROR] SMTP_USER or SMTP_PASS is undefined in process.env!");
    return res.status(500).json({ 
      success: false, 
      error: 'SMTP Configuration Missing. Please check Railway Environment Variables.' 
    });
  }

  // 1. Return immediately to prevent UI hanging
  res.status(200).json({ success: true, message: 'Email successfully queued for background delivery.' });

  // 2. Process the email sending asynchronously in the background
  (async () => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"TravelOps System" <${process.env.SMTP_USER}>`,
        to,
        subject: subject || 'TravelOps Test Email',
        text: text || 'This is a test email from TravelOps.',
        html: html || '<b>This is a test email from TravelOps.</b>'
      });
      console.log(`[BACKGROUND TASK] Email successfully sent to ${to}. MessageID: ${info.messageId}`);
    } catch (error) {
      console.error(`[BACKGROUND TASK] Failed to send email to ${to}:`, error.message);
    }
  })();
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
