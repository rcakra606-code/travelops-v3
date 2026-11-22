import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sentryVitePlugin } from '@sentry/bundler-plugins/vite';
import { compression } from 'vite-plugin-compression2';
import { VitePWA } from 'vite-plugin-pwa';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { visualizer } from 'rollup-plugin-visualizer';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
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
import {
  validateCorporateExcelPayload,
  buildCorporateExcelPrompt
} from './src/utils/corporateAiPrompt.js';
import {
  validateFlightReservationPayload,
  buildFlightReservationPrompt
} from './src/utils/flightReservationPrompt.js';

dotenv.config();

const devDailyRemindersDispatched = new Map();

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
            const { prompt } = JSON.parse(body || '{}');
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

            const parsedData = await runGeminiFallback(client, async (model) => {
              const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: buildGeminiJsonConfig(model, { temperature: 0.2 })
              });
              return cleanJsonOutput(response.text);
            });

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

            const parsedData = await runGeminiFallback(client, async (model) => {
              const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: buildGeminiJsonConfig(model, { temperature: 0.2 })
              });
              return cleanJsonOutput(response.text);
            });

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
                config: buildGeminiChatConfig(model, { temperature: 0.65, maxOutputTokens: 4096 })
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

            const parsedData = await runGeminiFallback(client, async (model) => {
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
                      { text: prompt || 'Analyze this itinerary PDF and return structured JSON.' }
                    ]
                  }
                ],
                config: buildGeminiJsonConfig(model, { temperature: 0.1 })
              });
              return cleanJsonOutput(response.text);
            });

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

      // 6. Parse Tour Registration Form (PDF / Image) into Draft via Gemini Multimodal
      if (req.url === '/api/tours/parse-registration-form' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { fileBase64, mimeType, fileName, staffList } = JSON.parse(body || '{}');
            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY belum terkonfigurasi.' }));
            }

            const validation = validateRegistrationFilePayload(fileBase64, mimeType);
            if (!validation.valid) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: validation.error }));
            }

            const prompt = buildTourRegistrationPrompt(Array.isArray(staffList) ? staffList : []);
            const parsedData = await runGeminiFallback(client, async (model) => {
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
              return cleanJsonOutput(response.text);
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              fileName: fileName || 'Formulir_Pendaftaran.pdf',
              data: parsedData
            }));
          } catch (err) {
            console.error('[DEV PARSE TOUR FORM ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Gagal memproses Formulir Pendaftaran dengan AI.'
            }));
          }
        });
        return;
      }

      // 7. Parse Visa / Document Request Form (Lark PDF / Image) into Draft(s) via Gemini Multimodal
      if (req.url === '/api/documents/parse-request-form' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { fileBase64, mimeType, fileName, staffList } = JSON.parse(body || '{}');
            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY belum terkonfigurasi.' }));
            }

            const validation = validateDocumentFilePayload(fileBase64, mimeType);
            if (!validation.valid) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: validation.error }));
            }

            const prompt = buildDocumentRequestPrompt(Array.isArray(staffList) ? staffList : []);
            const parsedData = await runGeminiFallback(client, async (model) => {
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
              return cleanJsonOutput(response.text);
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              fileName: fileName || 'Request_Visa_Document.pdf',
              data: parsedData
            }));
          } catch (err) {
            console.error('[DEV PARSE DOCUMENT FORM ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Gagal memproses Formulir Request Dokumen dengan AI.'
            }));
          }
        });
        return;
      }

      // 8. Enterprise Business Intelligence AI Analyst (Dev Middleware Parity)
      if (req.url === '/api/bi/generate-insights' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const { snapshot } = JSON.parse(body || '{}');
            const validation = validateBiSnapshotPayload(snapshot);
            if (!validation.valid) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: validation.error }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY belum terkonfigurasi.' }));
            }

            const prompt = buildBiAnalystPrompt(snapshot);
            const normalized = await runGeminiFallback(client, async (model) => {
              const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: buildGeminiJsonConfig(model, { temperature: 0.2, maxOutputTokens: 8192 })
              });
              const parsedData = cleanJsonOutput(response.text);
              return normalizeBiAiResponse(parsedData);
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, data: normalized }));
          } catch (err) {
            console.error('[DEV BI INSIGHTS ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Gagal menghasilkan analisis AI Business Intelligence.'
            }));
          }
        });
        return;
      }

      // 9. AI Corporate Accounts Excel / CSV Parser (Dev Middleware Parity)
      if (req.url === '/api/corporate/parse-accounts-excel' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const validation = validateCorporateExcelPayload(payload);
            if (!validation.valid) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: validation.error }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY belum terkonfigurasi.' }));
            }

            const cleanFileName = (payload.fileName || 'Corporate_Accounts.xlsx')
              .replace(/[^a-zA-Z0-9_.\- ]/g, '')
              .trim();

            const prompt = buildCorporateExcelPrompt({
              sheetName: validation.sheetName,
              fileName: cleanFileName,
              totalRows: validation.totalRows,
              previewRows: validation.previewRows
            });

            const parsedData = await runGeminiFallback(client, async (model) => {
              const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: buildGeminiJsonConfig(model, { temperature: 0.1, maxOutputTokens: 8192 })
              });
              const parsed = cleanJsonOutput(response.text);
              if (!parsed || typeof parsed !== 'object') {
                throw new Error('AI tidak dapat memetakan struktur Excel akun corporate.');
              }
              return parsed;
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              fileName: cleanFileName,
              sheetName: validation.sheetName,
              data: parsedData
            }));
          } catch (err) {
            console.error('[DEV CORPORATE EXCEL AI ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Gagal memproses file Excel Akun Corporate dengan AI.'
            }));
          }
        });
        return;
      }

      // 10. AI Flight Ticket Reservation Parser (Screenshot / PDF / Pure GDS Text)
      if (req.url === '/api/flights/parse-reservation' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const validation = validateFlightReservationPayload(payload);
            if (!validation.valid) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: validation.error }));
            }

            const client = getDevAiClient();
            if (!client) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, error: 'GEMINI_API_KEY belum terkonfigurasi.' }));
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

            const parsedData = await runGeminiFallback(client, async (model) => {
              const response = await client.models.generateContent({
                model,
                contents: [{ role: 'user', parts }],
                config: buildGeminiJsonConfig(model, { temperature: 0.1, maxOutputTokens: 8192 })
              });
              const parsed = cleanJsonOutput(response.text);
              if (!parsed || typeof parsed !== 'object') {
                throw new Error('AI tidak dapat mengekstrak jadwal penerbangan dari data ini.');
              }
              return parsed;
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              fileName: validation.fileName || undefined,
              data: parsedData
            }));
          } catch (err) {
            console.error('[DEV FLIGHT RESERVATION AI ERROR]', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: false,
              error: err.message || 'Gagal memproses data reservasi tiket pesawat dengan AI.'
            }));
          }
        });
        return;
      }

      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN || env.SENTRY_AUTH_TOKEN;
  const sentryRelease = process.env.VITE_SENTRY_RELEASE || env.VITE_SENTRY_RELEASE || 'travelops-frontend@4.0.0';

  const isAnalyze = mode === 'analyze' || process.env.ANALYZE === 'true' || env.ANALYZE === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiPlugin(),
      ViteImageOptimizer({
        test: /\.(jpe?g|png|gif|tiff|webp|avif)$/i, // Exclude SVG sprites (public/icons.svg)
        png: { quality: 80 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { lossless: false, quality: 80 }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false, // Uses existing public/manifest.json
        workbox: {
          sourcemap: false,
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
          globIgnores: ['**/*.map', '**/dist-bundle-stats.html'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
              }
            }
          ]
        }
      }),
      compression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 1024,
        exclude: [/\.(map|png|jpe?g|webp|avif|gif|ico|woff2)$/i]
      }),
      isAnalyze
        ? visualizer({
            filename: 'dist-bundle-stats.html',
            gzipSize: true,
            brotliSize: true,
            open: false
          })
        : null,
      // Sentry Vite plugin MUST come after all other plugins; uploads hidden source maps on production builds when SENTRY_AUTH_TOKEN is set
      sentryAuthToken
        ? sentryVitePlugin({
            org: 'cakra-ib',
            project: 'travelops-frontend',
            authToken: sentryAuthToken,
            release: { name: sentryRelease },
            sourcemaps: {
              filesToDeleteAfterUpload: ['./dist/**/*.map']
            }
          })
        : null
    ].filter(Boolean),
    build: {
      sourcemap: 'hidden',
      chunkSizeWarningLimit: 650,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            // Normalize Windows backslashes so regex matching is identical on Windows & Linux (Railway)
            const normalized = id.replace(/\\/g, '/');
            // Let dynamic-import heavy libraries (jspdf, exceljs, html2canvas, papaparse, recharts)
            // split naturally along lazy route/import boundaries so they NEVER modulepreload on /login or /track.
            if (/\/node_modules\/@sentry\//.test(normalized)) return 'vendor-sentry';
            if (/\/node_modules\/@supabase\//.test(normalized)) return 'vendor-supabase';
            if (/\/node_modules\/@tanstack\//.test(normalized)) return 'vendor-tanstack';
            if (/\/node_modules\/lucide-react\//.test(normalized)) return 'vendor-icons';
            if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(normalized)) return 'vendor-motion';
            if (/\/node_modules\/(react-router|react-router-dom)\//.test(normalized)) return 'vendor-router';
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(normalized)) return 'vendor-react-core';
          }
        }
      }
    },
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
  };
});
