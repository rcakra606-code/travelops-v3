import { logger } from './logger.js';
import { cacheGet, cacheSet } from './cache.js';

const EMBEDDING_MODELS = ['gemini-embedding-001'];

/**
 * Generates a 768-dimensional embedding vector using Gemini Embedding API.
 * Returns null gracefully if API key is missing or embedding model fails.
 */
export async function generateTextEmbedding(aiClient, text) {
  if (!aiClient || !text || !String(text).trim()) return null;

  const trimmed = String(text).trim().slice(0, 4000);
  for (const model of EMBEDDING_MODELS) {
    try {
      const response = await aiClient.models.embedContent({
        model,
        contents: trimmed,
        config: { outputDimensionality: 768 }
      });
      const values =
        response?.embeddings?.[0]?.values ||
        response?.embedding?.values ||
        null;
      if (Array.isArray(values) && values.length === 768) {
        return values;
      }
    } catch (err) {
      logger.debug({ model, err: err.message }, 'Embedding model attempt failed, trying fallback');
    }
  }
  return null;
}

export function formatVectorLiteral(values) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return `[${values.map((n) => Number(n).toFixed(6)).join(',')}]`;
}

export function buildKnowledgeEmbeddingText(type, row) {
  if (!row) return '';
  if (type === 'country') {
    return [
      `Country: ${row.name || ''} (${row.id || ''})`,
      row.region ? `Region: ${row.region}` : '',
      row.general_info || '',
      row.visa_info ? `Visa: ${JSON.stringify(row.visa_info)}` : '',
      row.currency ? `Currency: ${JSON.stringify(row.currency)}` : '',
      row.power_plugs ? `Plugs: ${JSON.stringify(row.power_plugs)}` : '',
      row.customs_etiquette ? `Customs: ${JSON.stringify(row.customs_etiquette)}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (type === 'city') {
    return [
      `City: ${row.name || ''} (${row.country_id || ''})`,
      row.general_info || '',
      row.airports ? `Airports: ${JSON.stringify(row.airports)}` : '',
      row.transport_apps ? `Transport: ${JSON.stringify(row.transport_apps)}` : '',
      row.food_highlights ? `Food: ${JSON.stringify(row.food_highlights)}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  }
  if (type === 'object') {
    return [
      `Attraction: ${row.name || ''} (${row.category || ''}, ${row.country_id || ''})`,
      row.general_info || '',
      row.dress_code ? `Dress code: ${row.dress_code}` : '',
      row.ticket_policy ? `Ticket: ${JSON.stringify(row.ticket_policy)}` : '',
      row.guide_briefing_notes ? `Briefing: ${JSON.stringify(row.guide_briefing_notes)}` : ''
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    `Tour Route: ${row.title || ''} (${row.duration_days || 0}D${row.duration_nights || 0}N, ${row.country_name || ''})`,
    row.general_info || '',
    row.cities_sequence ? `Cities: ${JSON.stringify(row.cities_sequence)}` : '',
    row.route_highlights ? `Highlights: ${JSON.stringify(row.route_highlights)}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

function getModuleContext(currentPath) {
  const path = (currentPath || '').toLowerCase();
  if (path.includes('/tour')) {
    return 'Tour Management & Itinerary Planning (Focus: tour schedules, group pacing, driver hours, itinerary breakdown, FOC, margin calculation)';
  }
  if (path.includes('/document')) {
    return 'Document & Visa Operations (Focus: passport validity min 6 months, visa requirements for Indonesian passport holders, embassy appointments, biometrics, document completion tracking)';
  }
  if (path.includes('/hotel')) {
    return 'Hotel Reservations & Accommodations (Focus: group rates, rooming list formats, bed types Twin/Double, city tax, early check-in/late check-out, breakfast vouchers)';
  }
  if (path.includes('/cruise')) {
    return 'Cruise Bookings & Sea Packages (Focus: cabin categories, port taxes, gratuities, shore excursion timing, passenger manifest)';
  }
  if (path.includes('/corporate')) {
    return 'Corporate Accounts & MICE (Focus: B2B proposals, corporate travel policy adherence, RFP quotations, payment terms, attendee rosters)';
  }
  if (path.includes('/knowledge') || path.includes('/destination')) {
    return 'Destination Knowledge Base & Intelligence (Focus: plug/voltage standards, local currency & tipping etiquette, emergency numbers, cultural dos & donts)';
  }
  return 'TravelOps General Operations (Ticketing, Customer Service, General Inquiries)';
}

function formatKnowledgeMatch(match) {
  const meta = match.metadata || {};
  if (match.entity_type === 'country') {
    const visa = meta.visa_info ? JSON.stringify(meta.visa_info) : 'Check requirements';
    const plugs = meta.power_plugs ? JSON.stringify(meta.power_plugs) : 'Standard';
    const curr = meta.currency ? JSON.stringify(meta.currency) : 'Local';
    return `• [Country] ${match.title} | Visa: ${visa} | Plugs: ${plugs} | Currency: ${curr}${match.summary ? `\n  Overview: ${match.summary}` : ''}`;
  }
  if (match.entity_type === 'city') {
    const airports = Array.isArray(meta.airports) ? meta.airports.join(', ') : '';
    return `• [City] ${match.title} (${match.country_name || '-'}) ${airports ? `| Airports: ${airports}` : ''}${match.summary ? `\n  Overview: ${match.summary}` : ''}`;
  }
  if (match.entity_type === 'object') {
    return `• [POI] ${match.title} (${meta.category || 'Attraction'}) | Dress: ${meta.dress_code || '-'}${match.summary ? `\n  Overview: ${match.summary}` : ''}`;
  }
  const cities = Array.isArray(meta.cities_sequence) ? meta.cities_sequence.join(' ➔ ') : '';
  return `• [Tour Route] "${match.title}" (${meta.duration_days || '?'}D${meta.duration_nights || '?'}N, ${match.country_name || '-'})${cities ? ` | Cities: ${cities}` : ''}`;
}

/**
 * Hybrid RAG Operational Grounding Retriever:
 * 1. Fast PostgreSQL pg_trgm trigram RPC (`search_travelops_knowledge`)
 * 2. Semantic pgvector HNSW RPC (`match_travelops_knowledge`) when embeddings exist
 * 3. Cached in Redis / Memory LRU for 120s to avoid repetitive DB & embedding calls
 */
export async function getHybridOperationalGrounding({
  supabaseAdmin,
  aiClient,
  message,
  currentPath
}) {
  const contextNotes = [`[Active Screen / Module Context]: ${getModuleContext(currentPath)}`];
  if (!supabaseAdmin || !message?.trim()) {
    return { contextText: contextNotes.join('\n'), grounded: false, matchCount: 0 };
  }

  const normalizedQuery = message.trim().toLowerCase().slice(0, 240);
  const cacheKey = `rag:v2:${(currentPath || '/').toLowerCase()}:${normalizedQuery}`;
  const cached = await cacheGet(cacheKey);
  if (cached) {
    return cached;
  }

  const mergedMap = new Map();

  try {
    // Run trigram RPC and (optionally) vector embedding in parallel
    const trigramPromise = supabaseAdmin.rpc('search_travelops_knowledge', {
      search_query: message.trim().slice(0, 300),
      max_results: 6
    });

    const vectorPromise = aiClient
      ? generateTextEmbedding(aiClient, message.trim())
          .then(async (vec) => {
            if (!vec) return { data: [] };
            return await supabaseAdmin.rpc('match_travelops_knowledge', {
              query_embedding: formatVectorLiteral(vec),
              match_threshold: 0.5,
              match_count: 5
            });
          })
          .catch(() => ({ data: [] }))
      : Promise.resolve({ data: [] });

    const [trigramRes, vectorRes] = await Promise.all([trigramPromise, vectorPromise]);

    for (const row of vectorRes?.data || []) {
      const key = `${row.entity_type}:${row.entity_id}`;
      mergedMap.set(key, { ...row, combinedScore: Number(row.similarity || 0) * 1.15 });
    }

    for (const row of trigramRes?.data || []) {
      const key = `${row.entity_type}:${row.entity_id}`;
      const existing = mergedMap.get(key);
      const trigramScore = Number(row.score || 0);
      if (existing) {
        existing.combinedScore = Math.max(existing.combinedScore, trigramScore) + 0.15;
      } else {
        mergedMap.set(key, { ...row, combinedScore: trigramScore });
      }
    }

    const topMatches = Array.from(mergedMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, 6);

    if (topMatches.length > 0) {
      contextNotes.push('\n[Verified Company Destination Knowledge (Hybrid pgvector + pg_trgm RAG)]:');
      for (const match of topMatches) {
        contextNotes.push(formatKnowledgeMatch(match));
      }
    }

    const result = {
      contextText: contextNotes.join('\n'),
      grounded: topMatches.length > 0,
      matchCount: topMatches.length
    };
    await cacheSet(cacheKey, result, 120);
    return result;
  } catch (err) {
    logger.warn({ err: err.message }, 'Hybrid RAG grounding warning (non-blocking)');
    return { contextText: contextNotes.join('\n'), grounded: false, matchCount: 0 };
  }
}

/**
 * Generates and stores pgvector embeddings for Knowledge Base rows missing embeddings.
 */
export async function backfillKnowledgeEmbeddings({ supabaseAdmin, aiClient, limitPerTable = 50 }) {
  if (!supabaseAdmin || !aiClient) {
    return { updated: 0, skipped: 0, errors: 0 };
  }

  const targets = [
    { table: 'travelops_dest_countries', type: 'country' },
    { table: 'travelops_dest_cities', type: 'city' },
    { table: 'travelops_dest_objects', type: 'object' },
    { table: 'travelops_tour_routes', type: 'route' }
  ];

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const target of targets) {
    const { data: rows, error } = await supabaseAdmin
      .from(target.table)
      .select('*')
      .is('embedding', null)
      .limit(limitPerTable);

    if (error || !Array.isArray(rows)) {
      logger.warn({ table: target.table, err: error?.message }, 'Embedding backfill query failed');
      continue;
    }

    for (const row of rows) {
      const text = buildKnowledgeEmbeddingText(target.type, row);
      if (!text.trim()) {
        skipped += 1;
        continue;
      }

      const vec = await generateTextEmbedding(aiClient, text);
      if (!vec) {
        errors += 1;
        continue;
      }

      const { error: updErr } = await supabaseAdmin
        .from(target.table)
        .update({ embedding: formatVectorLiteral(vec) })
        .eq('id', row.id);

      if (updErr) {
        errors += 1;
      } else {
        updated += 1;
      }
    }
  }

  return { updated, skipped, errors };
}
