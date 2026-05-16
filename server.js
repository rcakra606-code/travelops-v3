import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

// Force Node.js to use IPv4 first. Railway does not support outbound IPv6,
// which causes ENETUNREACH errors when connecting to smtp.gmail.com
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// API Route for sending emails
app.post('/api/send-email', emailLimiter, (req, res) => {
  const { to, subject, text, html, smtpConfig } = req.body;

  // 1. Return immediately to prevent UI hanging
  res.status(200).json({ success: true, message: 'Email successfully queued for background delivery.' });

  // 2. Process the email sending asynchronously in the background
  (async () => {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host || 'smtp.gmail.com',
        port: smtpConfig.port || 587,
        secure: smtpConfig.port == 465, // true for 465, false for other ports
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      });

      const info = await transporter.sendMail({
        from: `"TravelOps System" <${smtpConfig.user}>`,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
