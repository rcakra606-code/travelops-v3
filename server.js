import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Middleware
app.use(cors());
app.use(express.json());

// API Route for sending emails
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html, smtpConfig } = req.body;

  try {
    // We use the SMTP credentials provided from the frontend settings
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

    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
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
