import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { backfillKnowledgeEmbeddings } from '../server/rag.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

if (!supabaseUrl || !serviceKey || !geminiKey) {
  console.error('Missing VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or GEMINI_API_KEY in .env');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const aiClient = new GoogleGenAI({ apiKey: geminiKey });

backfillKnowledgeEmbeddings({ supabaseAdmin, aiClient, limitPerTable: 200 })
  .then((summary) => {
    console.log('✅ Knowledge Base pgvector backfill completed:', summary);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Embedding backfill failed:', err);
    process.exit(1);
  });
