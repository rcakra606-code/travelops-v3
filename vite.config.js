import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';

const emailDevPlugin = () => ({
  name: 'email-dev-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/api/send-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const { to, subject, text, html, smtpConfig } = data;

            const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
            const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
            const user = smtpConfig?.user || process.env.SMTP_USER;
            const pass = smtpConfig?.pass || process.env.SMTP_PASS;
            const senderName = smtpConfig?.senderName || 'TravelOps System';

            if (!to) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Recipient email is required.' }));
            }

            if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_app_password') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: false, 
                error: 'SMTP credentials missing. Please enter your valid SMTP Username/Email and Password in Settings.' 
              }));
            }

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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ 
              success: true, 
              message: `Email successfully delivered to ${to}! MessageID: ${info.messageId}` 
            }));
          } catch (err) {
            console.error('[EMAIL ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ 
              success: false, 
              error: err.message || 'Failed to connect to SMTP server.' 
            }));
          }
        });
      } else {
        next();
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emailDevPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
