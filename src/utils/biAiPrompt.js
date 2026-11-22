/**
 * PII-Free Business Intelligence Snapshot Builder, Prompt Factory & Response Normalizer
 * Shared by Frontend (ExecutiveBI) and Backend (server.js & vite.config.js)
 */

const ALLOWED_DOMAINS = new Set(['Operational', 'Financial', 'Business']);
const ALLOWED_SEVERITIES = new Set(['critical', 'warning', 'opportunity', 'info']);
const ALLOWED_CONFIDENCE = new Set(['high', 'medium', 'low']);
const ALLOWED_ROUTES = new Set([
  '/tours',
  '/documents',
  '/corporate',
  '/sales',
  '/productivity',
  '/hotel',
  '/cruise',
  '/telecom',
  '/overtime',
  '/staff-performance'
]);

const round1 = (n) => (typeof n === 'number' && Number.isFinite(n) ? Number(n.toFixed(1)) : null);

/**
 * Strips all customer/guest PII (no guest names, emails, phones, passports, AWBs, bank numbers).
 * Retains ONLY aggregated operational, financial, and business KPIs + comparison deltas.
 */
export const buildPiiFreeBiSnapshot = (analytics, { userRole = 'Staff' } = {}) => {
  if (!analytics || typeof analytics !== 'object') {
    return null;
  }

  const meta = analytics.meta || {};
  const op = analytics.operational || {};
  const fin = analytics.financial || {};
  const biz = analytics.business || {};

  return {
    context: {
      periodPreset: meta.periodPreset || 'this_quarter',
      currentPeriod: meta.currentWindowLabel || '-',
      comparisonPeriod: meta.previousWindowLabel || 'Tidak ada pembanding (All Time)',
      scope: meta.scope === 'mine' ? 'Portofolio Pribadi Konsultan' : 'Seluruh Cabang',
      userRole,
      totalRecordsAnalyzed: meta.totalRecordsAnalyzed || 0,
      corporateDataIncluded: Boolean(meta.includeCorporate)
    },
    operationalSummary: {
      totalBookings: op.kpis?.totalBookings?.value || 0,
      bookingsDelta: op.kpis?.totalBookings?.delta?.label || 'N/A',
      bookingsBreakdown: op.kpis?.totalBookings?.breakdown || '',
      totalPax: op.kpis?.totalPax?.value || 0,
      paxDelta: op.kpis?.totalPax?.delta?.label || 'N/A',
      tourConfirmationRatePct: round1(op.kpis?.tourConfirmationRate?.value),
      tourConfirmationDelta: op.kpis?.tourConfirmationRate?.delta?.label || 'N/A',
      tourCancellationRatePct: round1(op.kpis?.tourCancellationRate?.value),
      tourCancellationDelta: op.kpis?.tourCancellationRate?.delta?.label || 'N/A',
      avgDocTurnaroundDays: round1(op.kpis?.avgDocTurnaroundDays?.value),
      docTurnaroundSamples: op.kpis?.avgDocTurnaroundDays?.samples || 0,
      docSlaCompliancePct: round1(op.kpis?.avgDocTurnaroundDays?.slaRate),
      docOverdueCount: op.kpis?.avgDocTurnaroundDays?.overdueCount || 0,
      overtimeHours: round1(op.kpis?.overtimeHours?.value),
      pendingOvertimeCount: op.kpis?.overtimeHours?.pendingCount || 0,
      topSuppliers: (op.supplierPerformance || []).slice(0, 5).map((s) => ({
        name: s.name,
        bookings: s.bookings,
        revenueIdr: Math.round(s.revenue || 0),
        modules: s.modules
      }))
    },
    financialSummary: {
      operationalRevenueIdr: Math.round(fin.kpis?.operationalRevenue?.value || 0),
      revenueDelta: fin.kpis?.operationalRevenue?.delta?.label || 'N/A',
      tourOmsetIdr: Math.round(fin.kpis?.operationalRevenue?.tourOmset || 0),
      corporateRevenueIdr: Math.round(fin.kpis?.operationalRevenue?.corpRevenue || 0),
      documentFeeRevenueIdr: Math.round(fin.kpis?.operationalRevenue?.docRevenue || 0),
      grossProfitIdr: Math.round(fin.kpis?.grossProfit?.value || 0),
      grossProfitDelta: fin.kpis?.grossProfit?.delta?.label || 'N/A',
      grossMarginPct: round1(fin.kpis?.grossProfit?.marginPct),
      grossMarginDelta: fin.kpis?.grossProfit?.marginDelta?.label || 'N/A',
      outstandingReceivablesIdr: Math.round(fin.kpis?.outstandingReceivables?.value || 0),
      unpaidToursCount: fin.kpis?.outstandingReceivables?.unpaidCount || 0,
      urgentReceivablesH7Idr: Math.round(fin.kpis?.outstandingReceivables?.urgentAmount || 0),
      urgentReceivablesH7Count: fin.kpis?.outstandingReceivables?.urgentCount || 0,
      cancelledBookingValueIdr: Math.round(fin.kpis?.cancelledBookingValue?.value || 0),
      productivityPnlSalesIdr: Math.round(fin.kpis?.productivityLedger?.sales || 0),
      productivityPnlProfitIdr: Math.round(fin.kpis?.productivityLedger?.profit || 0),
      productivityPnlMarginPct: round1(fin.kpis?.productivityLedger?.marginPct),
      corporateCreditLimitTotalIdr: Math.round(fin.kpis?.corporateCredit?.totalLimit || 0),
      corporateCreditUtilizationPct: round1(fin.kpis?.corporateCredit?.utilizationPct),
      corporateAccountsNearOrOverLimit: fin.kpis?.corporateCredit?.overLimitCount || 0,
      receivablesAging: (fin.receivablesAging || []).map((a) => ({
        bucket: a.bucket,
        bookings: a.count,
        amountIdr: Math.round(a.amount || 0)
      }))
    },
    businessSummary: {
      avgTourOrderValueIdr: Math.round(biz.kpis?.avgTourOrderValue?.value || 0),
      avgTourOrderValueDelta: biz.kpis?.avgTourOrderValue?.delta?.label || 'N/A',
      revenuePerPaxIdr: Math.round(biz.kpis?.avgTourOrderValue?.revenuePerPax || 0),
      quotaAttainmentPct: round1(biz.kpis?.quotaAttainment?.value),
      quotaConsultantsTotal: biz.kpis?.quotaAttainment?.totalConsultants || 0,
      quotaAchievedCount: biz.kpis?.quotaAttainment?.tiers?.achieved || 0,
      quotaNeedsCoachingCount: biz.kpis?.quotaAttainment?.tiers?.needsCoaching || 0,
      corporateActiveAccounts: biz.kpis?.corporateRetention?.activeAccounts || 0,
      corporateBillingAccounts: biz.kpis?.corporateRetention?.billingAccounts || 0,
      corporateRepeatAccounts: biz.kpis?.corporateRetention?.repeatAccounts || 0,
      corporateDormantAccounts: biz.kpis?.corporateRetention?.dormantAccounts || 0,
      top3CorporateConcentrationPct: round1(biz.kpis?.corporateRetention?.top3SharePct),
      tourSchemes: (biz.tourSchemePerformance || []).map((s) => ({
        scheme: s.scheme,
        bookings: s.bookings,
        pax: s.pax,
        omsetIdr: Math.round(s.omset || 0),
        marginPct: s.marginPct,
        cancelRatePct: s.cancelRatePct
      })),
      topDestinations: (biz.destinationProfitability || []).slice(0, 6).map((d) => ({
        country: d.country,
        bookings: d.bookings,
        pax: d.pax,
        omsetIdr: Math.round(d.omset || 0),
        marginPct: d.marginPct,
        cancelRatePct: d.cancelRatePct
      }))
    },
    detectedDeterministicSignals: (analytics.signals || []).map((s) => ({
      domain: s.domain,
      severity: s.severity,
      title: s.title,
      detail: s.detail
    })),
    unavailableMetrics: meta.unavailableMetrics || []
  };
};

/**
 * Validates incoming BI snapshot payload on the backend.
 */
export const validateBiSnapshotPayload = (snapshot) => {
  if (!snapshot || typeof snapshot !== 'object') {
    return { valid: false, error: 'BI snapshot data is required.' };
  }
  if (!snapshot.context || !snapshot.operationalSummary || !snapshot.financialSummary || !snapshot.businessSummary) {
    return { valid: false, error: 'Incomplete BI snapshot structure.' };
  }
  const serialized = JSON.stringify(snapshot);
  if (serialized.length > 60_000) {
    return { valid: false, error: 'BI snapshot payload exceeds safe size limit.' };
  }
  return { valid: true };
};

/**
 * Enterprise BI Analyst Prompt (Strict 7-element structured JSON output)
 */
export const buildBiAnalystPrompt = (snapshot) => {
  return `You are a Principal Enterprise Travel Agency Business Intelligence Analyst reviewing live aggregated operational, financial, and commercial data from an internal Travel Agency BI platform (TravelOps V4).

STRICT GOVERNANCE RULES:
1. Analyze ONLY the exact numbers provided in the JSON snapshot below. NEVER fabricate, estimate, or invent metrics that are absent.
2. Respect unavailableMetrics explicitly: do NOT claim to have analyzed Net Profit, Operating Expenses, Vendor AP, or retail CAC if listed as unavailable.
3. Distinguish correlation from causation (use careful analytical phrasing such as "berkorelasi dengan", "terindikasi dari", "perlu diverifikasi" rather than asserting unproven root causes).
4. Write in concise, executive-grade Bahasa Indonesia with standard travel agency terminology (omset, gross margin, sisa pelunasan, credit limit, pax, SLA dokumen, cancellation rate).
5. Generate between 4 and 7 high-impact insights balanced across Operational, Financial, and Business domains (prioritizing anomalies, cash-collection/AR risks, margin drivers, SLA bottlenecks, and growth opportunities).
6. EVERY insight MUST populate all 7 required analytical fields accurately.

INPUT AGGREGATED SNAPSHOT (PII-FREE):
${JSON.stringify(snapshot, null, 2)}

OUTPUT FORMAT — Respond ONLY with valid JSON matching this exact schema:
{
  "executiveSummary": "Ringkasan eksekutif 2-3 kalimat padat tentang kondisi operasional, finansial, dan bisnis pada periode ini berdasarkan angka aktual.",
  "dataCoverageNote": "1 kalimat kualifikasi cakupan data & metrik yang belum tersedia di database.",
  "insights": [
    {
      "id": "ins-1",
      "title": "Judul temuan singkat dan tegas (maks 10 kata)",
      "domain": "Operational | Financial | Business",
      "severity": "critical | warning | opportunity | info",
      "metric": "Nama metrik bisnis & nilai aktual (contoh: Piutang Tour Mendesak <= H-7: Rp 80,000,000)",
      "supportingData": "Data pendukung eksplisit + periode pembanding (contoh: Q1 2026 vs Q4 2025, 4 dari 12 booking)",
      "whatChanged": "Penjelasan perubahan atau pola yang terdeteksi (bedakan korelasi dan kausalitas)",
      "businessImpact": "Dampak potensial terhadap arus kas, profitabilitas, SLA layanan, atau retensi klien",
      "recommendedAction": "Langkah operasional/komersial spesifik yang dapat segera dieksekusi tim",
      "targetRoute": "/tours | /documents | /corporate | /sales | /productivity | /hotel | /cruise | /telecom | /overtime | /staff-performance",
      "confidence": "high | medium | low",
      "dataQualityNote": "Kualifikasi kualitas data / jumlah sampel / batasan data terkait insight ini"
    }
  ]
}`;
};

/**
 * Safely normalizes Gemini JSON output so the UI always receives guaranteed 7-element insights.
 */
export const normalizeBiAiResponse = (raw) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Respons AI tidak valid atau kosong.');
  }

  const rawInsights = Array.isArray(raw.insights) ? raw.insights : [];
  const insights = rawInsights
    .filter((item) => item && typeof item === 'object' && item.title)
    .slice(0, 8)
    .map((item, idx) => {
      const domain = ALLOWED_DOMAINS.has(item.domain) ? item.domain : 'Business';
      const severity = ALLOWED_SEVERITIES.has(item.severity) ? item.severity : 'info';
      const confidence = ALLOWED_CONFIDENCE.has(item.confidence) ? item.confidence : 'medium';
      const targetRoute = ALLOWED_ROUTES.has(item.targetRoute) ? item.targetRoute : null;

      return {
        id: String(item.id || `ins-${idx + 1}`),
        title: String(item.title || 'Temuan Bisnis').trim(),
        domain,
        severity,
        metric: String(item.metric || 'Metrik agregat periode terpilih').trim(),
        supportingData: String(item.supportingData || 'Berdasarkan data aktual periode aktif').trim(),
        whatChanged: String(item.whatChanged || '-').trim(),
        businessImpact: String(item.businessImpact || '-').trim(),
        recommendedAction: String(item.recommendedAction || 'Tinjau detail transaksi pada modul terkait.').trim(),
        targetRoute,
        confidence,
        dataQualityNote: String(
          item.dataQualityNote || 'Berdasarkan data yang tercatat di sistem pada periode analisis.'
        ).trim()
      };
    });

  return {
    executiveSummary: String(
      raw.executiveSummary || 'Ringkasan analitik berhasil dibuat berdasarkan data periode aktif.'
    ).trim(),
    dataCoverageNote: String(
      raw.dataCoverageNote || 'Analisis dibatasi pada data yang tersedia di database operasional saat ini.'
    ).trim(),
    insights
  };
};
