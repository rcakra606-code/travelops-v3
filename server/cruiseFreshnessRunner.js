/**
 * Server-Side Cruise AI Freshness Agent Runner (Grounded Gemini Search + Scheduled Auto-Refresh).
 */
import {
  cleanJsonOutput,
  buildGeminiJsonConfig,
  buildGeminiChatConfig
} from '../src/utils/aiJsonHelpers.js';
import {
  applyCruiseAuditToGuide,
  buildCruiseBrandAuditPrompt,
  buildSingleShipAuditPrompt,
  extractGroundingSources,
  normalizeCruiseAuditResult
} from '../src/utils/cruiseAiFreshnessAgent.js';
import {
  normalizeCruiseGuide,
  toCruiseGuideDbPayload
} from '../src/utils/cruiseSalesGuideHelpers.js';

/**
 * Audits a single cruise brand or individual ship using Gemini + Live Google Search Grounding.
 * Falls back gracefully to structured JSON mode if Google Search grounding is unavailable.
 */
export async function runCruiseAiAudit({
  aiClient,
  runWithModelFallback,
  mode = 'brand',
  guide,
  ship = null
}) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const prompt =
    mode === 'ship' && ship
      ? buildSingleShipAuditPrompt(guide, ship, { todayIso })
      : buildCruiseBrandAuditPrompt(guide, { todayIso });

  // Attempt 1: Live Google Search Grounding (real-time web verification + source citations)
  try {
    const groundedResult = await runWithModelFallback(async (model) => {
      const response = await aiClient.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          ...buildGeminiChatConfig(model, { temperature: 0.15, maxOutputTokens: 8192 }),
          tools: [{ googleSearch: {} }]
        }
      });

      const parsed = cleanJsonOutput(response.text);
      const sources = extractGroundingSources(response);
      return normalizeCruiseAuditResult(parsed, {
        mode,
        guide,
        ship,
        sources,
        webGrounded: true,
        modelUsed: model
      });
    });

    return groundedResult;
  } catch (groundedErr) {
    console.warn(
      `[Cruise AI Freshness] Grounded web search unavailable (${groundedErr?.message}), falling back to standard Gemini JSON audit.`
    );
  }

  // Attempt 2: Standard Gemini Structured JSON fallback
  return runWithModelFallback(async (model) => {
    const response = await aiClient.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: buildGeminiJsonConfig(model, { temperature: 0.15, maxOutputTokens: 8192 })
    });
    const parsed = cleanJsonOutput(response.text);
    return normalizeCruiseAuditResult(parsed, {
      mode,
      guide,
      ship,
      sources: [],
      webGrounded: false,
      modelUsed: model
    });
  });
}

/**
 * Automated scheduled freshness runner for `/api/cron/cruise-guide-refresh`.
 * Checks stale cruise brands in Supabase `travelops_cruise_guides`, records audit status/notes,
 * and optionally auto-applies verified changes when `autoApply: true`.
 */
export async function runScheduledCruiseRefresh({
  supabaseAdmin,
  aiClient,
  runWithModelFallback,
  staleDays = 14,
  forceAll = false,
  autoApply = false,
  maxBrands = 10
}) {
  if (!supabaseAdmin) {
    throw new Error('Supabase Admin client tidak terkonfigurasi.');
  }
  if (!aiClient) {
    throw new Error('GEMINI_API_KEY belum terkonfigurasi di server.');
  }

  const { data: rows, error } = await supabaseAdmin
    .from('travelops_cruise_guides')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  const guides = (rows || []).map(normalizeCruiseGuide).filter(Boolean);
  const cutoffMs = Date.now() - Math.max(1, Number(staleDays) || 14) * 24 * 60 * 60 * 1000;

  const targets = guides
    .filter((g) => {
      if (forceAll) return true;
      if (!g.lastVerifiedAt) return true;
      const ts = new Date(g.lastVerifiedAt).getTime();
      return Number.isNaN(ts) || ts < cutoffMs;
    })
    .slice(0, Math.min(20, Math.max(1, Number(maxBrands) || 10)));

  const results = [];
  let updatedInDb = 0;
  let updatesFound = 0;

  for (const guide of targets) {
    try {
      const audit = await runCruiseAiAudit({
        aiClient,
        runWithModelFallback,
        mode: 'brand',
        guide
      });

      if (audit.totalChanges > 0) updatesFound += 1;

      if (autoApply && audit.totalChanges > 0) {
        const merged = applyCruiseAuditToGuide(guide, audit, {
          updatedBy: 'Cruise AI Auto-Refresh Agent'
        });
        const dbRow = toCruiseGuideDbPayload(merged, 'Cruise AI Auto-Refresh Agent');
        const { error: upErr } = await supabaseAdmin
          .from('travelops_cruise_guides')
          .upsert([dbRow]);
        if (!upErr) updatedInDb += 1;
      } else {
        await supabaseAdmin
          .from('travelops_cruise_guides')
          .update({
            last_verified_at: audit.verifiedAt,
            audit_status: audit.status,
            verification_notes: `${audit.summary} (${audit.verificationNotes})`.slice(0, 600),
            updated_at: new Date().toISOString()
          })
          .eq('id', guide.id);
      }

      results.push({
        id: guide.id,
        brandName: guide.brandName,
        status: audit.status,
        totalChanges: audit.totalChanges,
        webGrounded: audit.webGrounded,
        summary: audit.summary
      });
    } catch (err) {
      results.push({
        id: guide.id,
        brandName: guide.brandName,
        status: 'error',
        error: err?.message || 'Audit failed'
      });
    }
  }

  return {
    success: true,
    checkedCount: targets.length,
    totalBrands: guides.length,
    updatesFound,
    updatedInDb,
    autoApply: Boolean(autoApply),
    ranAt: new Date().toISOString(),
    results
  };
}
