import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const devDailyRemindersDispatched = new Map();

// Helper to clean JSON output returned by LLMs
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
      } catch (e) {
        // continue
      }
    }
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
      } catch (e) {
        // continue
      }
    }
    throw err;
  }
}

// Resilient fallback executor for Gemini models
async function runGeminiFallback(client, runnerFn) {
  const models = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;
  for (const model of models) {
    try {
      return await runnerFn(model);
    } catch (err) {
      lastError = err;
      console.warn(`[VITE DEV GEMINI] Model ${model} call failed (${err.message}). Trying fallback model...`);
    }
  }
  throw lastError || new Error('All Gemini models failed');
}

let devAiClient = null;
const getDevAiClient = () => {
  if (devAiClient) return devAiClient;
  const key = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (key) {
    devAiClient = new GoogleGenAI({ apiKey: key });
  }
  return devAiClient;
};

const devApiPlugin = () => ({
  name: 'travelops-dev-api-plugin',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // 1. Email Dispatch Middleware
      if (req.url === '/api/send-email' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const { to, subject, text, html, smtpConfig, category } = data;

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

            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const dispatchKey = `${to.toLowerCase().trim()}_${todayStr}`;
            if (category === 'daily_reminder' && devDailyRemindersDispatched.has(dispatchKey)) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: true, 
                skipped: true, 
                message: `Daily reminder already sent to ${to} today (${todayStr}). Skipped duplicate to prevent spam.` 
              }));
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

            if (category === 'daily_reminder') {
              devDailyRemindersDispatched.set(dispatchKey, Date.now());
            }

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
        return;
      }

      // 2. Knowledge Freshness Entity Audit Middleware
      if (req.url === '/api/knowledge/audit-entity' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { prompt, entity, type } = JSON.parse(body || '{}');
            if (!prompt) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'prompt is required.' }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ 
                success: false, 
                error: 'GEMINI_API_KEY is not configured in .env. Please check your Gemini API key.' 
              }));
            }

            const response = await runGeminiFallback(client, async (model) => {
              return await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json' }
              });
            });

            const parsedData = cleanJsonOutput(response.text);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: parsedData }));
          } catch (err) {
            console.error('[DEV AUDIT ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ 
              success: false, 
              error: err.message || 'Knowledge audit failed on dev server.' 
            }));
          }
        });
        return;
      }

      // 3. Knowledge Destination Generation Middleware
      if (req.url === '/api/knowledge/generate-destination-ai' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { query, type, context } = JSON.parse(body || '{}');
            if (!query || !type) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'query and type are required.' }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY is not configured.' }));
            }

            const prompt = `You are a travel destination intelligence expert. Generate comprehensive, practical travel operations data for ${type}: "${query}". ${context ? `Context: ${context}` : ''}. Respond ONLY with valid JSON.`;

            const response = await runGeminiFallback(client, async (model) => {
              return await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: { responseMimeType: 'application/json' }
              });
            });

            const parsedData = cleanJsonOutput(response.text);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: parsedData }));
          } catch (err) {
            console.error('[DEV DESTINATION AI ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'AI generation failed.' }));
          }
        });
        return;
      }

      // 4. Copilot Chat Middleware
      if (req.url === '/api/ai/copilot-chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { message, history, currentPath } = JSON.parse(body || '{}');
            if (!message || !message.trim()) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'Message cannot be empty.' }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY is not configured.' }));
            }

            const contents = [];
            if (Array.isArray(history)) {
              history.forEach(m => {
                contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
              });
            }
            contents.push({ role: 'user', parts: [{ text: `[Context: ${currentPath || '/'}]\n${message}` }] });

            const response = await runGeminiFallback(client, async (model) => {
              return await client.models.generateContent({
                model,
                contents,
                config: { temperature: 0.65, maxOutputTokens: 2048 }
              });
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, text: response.text || '', grounded: false }));
          } catch (err) {
            console.error('[DEV COPILOT ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Copilot failed.' }));
          }
        });
        return;
      }

      // 5. Parse Itinerary PDF with Gemini Multimodal
      if (req.url === '/api/knowledge/parse-itinerary-pdf' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { pdfBase64, prompt } = JSON.parse(body || '{}');
            if (!pdfBase64) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'pdfBase64 is required.' }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY is not configured.' }));
            }

            let cleanBase64 = pdfBase64;
            if (cleanBase64.includes('base64,')) {
              cleanBase64 = cleanBase64.split('base64,')[1];
            }
            cleanBase64 = cleanBase64.replace(/\s+/g, '');

            const response = await runGeminiFallback(client, async (model) => {
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
                      { text: prompt || 'Analyze this itinerary PDF and return structured JSON.' }
                    ]
                  }
                ],
                config: { responseMimeType: 'application/json' }
              });
            });

            const parsedData = cleanJsonOutput(response.text);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: parsedData }));
          } catch (err) {
            console.error('[DEV PARSE PDF ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: false, error: err.message || 'Failed to parse PDF.' }));
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devApiPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            console.warn(`[Vite Proxy] Backend server on http://localhost:3000 unavailable for ${req.url}.`);
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                error: 'Backend API server on http://localhost:3000 is offline. Start server with "node server.js" or use dev endpoints.' 
              }));
            }
          });
        }
      }
    }
  }
});
