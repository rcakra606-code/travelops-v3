/**
 * Cruise AI Freshness Agent — Shared Prompt Builder, Grounding Parser, Normalizer & Diff Engine.
 * Used by server.js (Express + Cron), vite.config.js (dev proxy), React UI, and unit tests.
 */

const ALLOWED_BRAND_PATCH_FIELDS = new Set([
  'tagline',
  'segment',
  'budgetTier',
  'homeports',
  'regions',
  'targetProfiles',
  'halalStatus',
  'halalNotes',
  'gratuityCurrency',
  'gratuityStandard',
  'gratuitySuite',
  'gratuityNotes',
  'minInfantMonths',
  'pregnancyMaxWeeks',
  'minBookingAge',
  'vipClubName',
  'typicalDurations',
  'dressCode',
  'websiteUrl'
]);

const VALID_AUDIT_STATUSES = new Set(['verified', 'update_available', 'critical_alert']);

export function validateCruiseAuditPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body audit cruise tidak valid.' };
  }
  const mode = body.mode === 'ship' ? 'ship' : 'brand';
  const guide = body.guide;
  if (!guide || typeof guide !== 'object' || !String(guide.brandName || guide.brand_name || '').trim()) {
    return { valid: false, error: 'Data brand cruise (guide.brandName) wajib disertakan.' };
  }
  if (mode === 'ship') {
    const ship = body.ship;
    if (!ship || typeof ship !== 'object' || !String(ship.name || '').trim()) {
      return { valid: false, error: 'Data kapal (ship.name) wajib disertakan untuk audit per kapal.' };
    }
    return { valid: true, mode, guide, ship };
  }
  return { valid: true, mode, guide, ship: null };
}

export function buildCruiseBrandAuditPrompt(guide, { todayIso = new Date().toISOString().slice(0, 10) } = {}) {
  const brandName = guide.brandName || guide.brand_name || 'Cruise Line';
  const ships = Array.isArray(guide.featuredShips || guide.featured_ships)
    ? guide.featuredShips || guide.featured_ships
    : [];

  const compactSnapshot = {
    brandName,
    segment: guide.segment,
    budgetTier: guide.budgetTier ?? guide.budget_tier,
    homeports: guide.homeports || [],
    halalStatus: guide.halalStatus ?? guide.halal_status,
    halalNotes: guide.halalNotes ?? guide.halal_notes,
    gratuityCurrency: guide.gratuityCurrency ?? guide.gratuity_currency,
    gratuityStandard: guide.gratuityStandard ?? guide.gratuity_standard,
    gratuitySuite: guide.gratuitySuite ?? guide.gratuity_suite,
    gratuityNotes: guide.gratuityNotes ?? guide.gratuity_notes,
    minInfantMonths: guide.minInfantMonths ?? guide.min_infant_months,
    pregnancyMaxWeeks: guide.pregnancyMaxWeeks ?? guide.pregnancy_max_weeks,
    minBookingAge: guide.minBookingAge ?? guide.min_booking_age,
    vipClubName: guide.vipClubName ?? guide.vip_club_name,
    dressCode: guide.dressCode ?? guide.dress_code,
    activeFleetCount: ships.length,
    activeFleetNames: ships.map((s) => `${s.name} (${s.yearBuilt || ''}${s.deployment ? `, ${s.deployment}` : ''})`)
  };

  return `Anda adalah "TravelOps Cruise Intelligence Auditor" — AI Agent senior untuk biro perjalanan Indonesia (Dwidayatour) yang memverifikasi akurasi informasi penjualan kapal pesiar secara faktual per tanggal ${todayIso}.

TUGAS AUDIT UNTUK BRAND: "${brandName}"
Gunakan pencarian web terbaru (bila tersedia) untuk memverifikasi data tersimpan berikut terhadap kondisi operasional terkini per ${todayIso}:

DATA TERSIMPAN SAAT INI:
${JSON.stringify(compactSnapshot, null, 2)}

HAL YANG WAJIB DIPERIKSA:
1. Tarif Gratuity / Service Charge terbaru (per orang per malam untuk kabin standar & suite + mata uangnya).
2. Status makanan Halal / sertifikasi Halal / kebijakan pre-order Halal terbaru.
3. Kebijakan penumpang penting: usia minimal bayi (bulan), batas maksimal ibu hamil (minggu), usia minimal pemesan utama, dress code, dan homeport utama (khususnya Asia/Singapura/Jepang/Eropa/Alaska).
4. Keakuratan daftar kapal yang sedang beroperasi:
   - Apakah ada kapal BARU yang sudah resmi beroperasi/delivered untuk ${brandName} tetapi belum ada di activeFleetNames?
   - Apakah ada kapal di activeFleetNames yang sudah PENSIUN / DIJUAL / PINDAH ke brand lain?
   - Apakah ada kapal dengan renovasi/refurbishment besar terbaru atau perpindahan homeport penting (misalnya masuk/keluar Singapura atau Jepang)?

ATURAN KETAT:
- HANYA laporkan perubahan jika Anda YAKIN secara faktual berdasarkan informasi resmi/terkini. Jangan mengarang angka atau kapal fiktif.
- Jika semua data sudah akurat dan tidak perlu diubah, kembalikan status "verified" dengan fieldChanges: [] dan fleetChanges kosong.
- Tulis summary, label, reason, dan highlight dalam Bahasa Indonesia profesional untuk tim sales travel.
- Field yang boleh muncul di "fieldChanges[].field" HANYA: tagline, segment, budgetTier, homeports, halalStatus, halalNotes, gratuityCurrency, gratuityStandard, gratuitySuite, gratuityNotes, minInfantMonths, pregnancyMaxWeeks, minBookingAge, vipClubName, dressCode.
- Untuk gratuityStandard, gratuitySuite, minInfantMonths, pregnancyMaxWeeks, minBookingAge, budgetTier: newValue HARUS berupa angka (number). Untuk homeports: newValue berupa array string.

BALAS HANYA DENGAN JSON VALID TANPA TEKS PEMBUKA/PENUTUP:
{
  "status": "verified" | "update_available" | "critical_alert",
  "summary": "Ringkasan audit 1-2 kalimat dalam Bahasa Indonesia",
  "fieldChanges": [
    {
      "field": "gratuityStandard",
      "label": "Tarif Gratuity Standar",
      "oldValue": 16,
      "newValue": 18,
      "reason": "Alasan singkat perubahan",
      "severity": "info" | "warning" | "critical"
    }
  ],
  "fleetChanges": {
    "newShips": [
      {
        "name": "Nama Kapal Baru",
        "shipClass": "Nama Class",
        "tonnage": "150.000 GT",
        "capacity": "4.000 tamu",
        "decks": 18,
        "yearBuilt": "2026",
        "deployment": "Wilayah operasi utama",
        "bestFor": "Segmen klien ideal",
        "highlight": "Daya tarik utama kapal",
        "reason": "Alasan penambahan"
      }
    ],
    "retiredOrTransferredShips": [
      { "name": "Nama Kapal", "reason": "Alasan keluar dari armada" }
    ],
    "updatedShips": [
      {
        "name": "Nama Kapal Persis Seperti di activeFleetNames",
        "changesSummary": "Ringkasan pembaruan",
        "patch": {
          "deployment": "Wilayah baru (opsional)",
          "yearBuilt": "2010 (Refurb 2026) (opsional)",
          "highlight": "Highlight terbarui (opsional)"
        }
      }
    ]
  },
  "verificationNotes": "Sumber singkat / catatan verifikasi per ${todayIso}"
}`;
}

export function buildSingleShipAuditPrompt(guide, ship, { todayIso = new Date().toISOString().slice(0, 10) } = {}) {
  const brandName = guide.brandName || guide.brand_name || 'Cruise Line';
  return `Anda adalah "TravelOps Cruise Ship Auditor" per tanggal ${todayIso}.
Verifikasi keakuratan data operasional terkini untuk kapal "${ship.name}" milik brand "${brandName}":

DATA KAPAL SAAT INI:
${JSON.stringify(ship, null, 2)}

PERIKSA:
1. Apakah kapal "${ship.name}" masih aktif beroperasi di bawah "${brandName}" (atau sudah pindah brand / pensiun / ganti nama)?
2. Apakah tonase, kapasitas, jumlah deck, tahun beroperasi/refurbishment terbaru, dan wilayah operasi (deployment/homeport) terkini sudah akurat?
3. Apakah ada pembaruan fasilitas ikonik / renovasi besar terbaru yang penting diketahui tim sales?

BALAS HANYA DENGAN JSON VALID TANPA TEKS PEMBUKA/PENUTUP:
{
  "status": "verified" | "update_available" | "critical_alert",
  "summary": "Ringkasan hasil verifikasi kapal dalam Bahasa Indonesia (1-2 kalimat)",
  "isStillOperating": true,
  "fieldChanges": [
    {
      "field": "deployment",
      "label": "Wilayah Operasi Utama",
      "oldValue": "...",
      "newValue": "...",
      "reason": "...",
      "severity": "info" | "warning" | "critical"
    }
  ],
  "fleetChanges": {
    "newShips": [],
    "retiredOrTransferredShips": [],
    "updatedShips": [
      {
        "name": "${ship.name}",
        "changesSummary": "Ringkasan update kapal (kosongkan array ini jika sudah akurat)",
        "patch": {}
      }
    ]
  },
  "verificationNotes": "Catatan verifikasi singkat per ${todayIso}"
}`;
}

export function extractGroundingSources(response) {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];
  const seen = new Set();
  const sources = [];
  for (const ch of chunks) {
    const uri = String(ch?.web?.uri || '').trim();
    const title = String(ch?.web?.title || '').trim();
    if (!uri || !/^https?:\/\//i.test(uri) || seen.has(uri)) continue;
    seen.add(uri);
    sources.push({
      title: title || uri.replace(/^https?:\/\//i, '').slice(0, 60),
      url: uri
    });
    if (sources.length >= 6) break;
  }
  return sources;
}

export function normalizeCruiseAuditResult(
  raw,
  { mode = 'brand', guide, ship = null, sources = [], webGrounded = false, modelUsed = '' } = {}
) {
  const safe = raw && typeof raw === 'object' ? raw : {};

  const rawFieldChanges = Array.isArray(safe.fieldChanges) ? safe.fieldChanges : [];
  const fieldChanges = rawFieldChanges
    .filter((ch) => ch && typeof ch === 'object' && ch.field && ch.newValue !== undefined)
    .filter((ch) => (mode === 'ship' ? true : ALLOWED_BRAND_PATCH_FIELDS.has(ch.field)))
    .map((ch) => ({
      field: String(ch.field).trim(),
      label: String(ch.label || ch.field).trim(),
      oldValue: ch.oldValue ?? '',
      newValue: ch.newValue,
      reason: String(ch.reason || '').trim(),
      severity: ['info', 'warning', 'critical'].includes(ch.severity) ? ch.severity : 'info'
    }));

  const rawFleet = safe.fleetChanges && typeof safe.fleetChanges === 'object' ? safe.fleetChanges : {};
  const newShips = (Array.isArray(rawFleet.newShips) ? rawFleet.newShips : [])
    .filter((s) => s && String(s.name || '').trim())
    .map((s) => ({
      name: String(s.name).trim(),
      shipClass: String(s.shipClass || '').trim(),
      tonnage: String(s.tonnage || '').trim(),
      capacity: String(s.capacity || '').trim(),
      decks: s.decks !== undefined && s.decks !== '' ? Number(s.decks) || '' : '',
      yearBuilt: String(s.yearBuilt || '').trim(),
      deployment: String(s.deployment || '').trim(),
      bestFor: String(s.bestFor || '').trim(),
      highlight: String(s.highlight || '').trim(),
      reason: String(s.reason || 'Kapal aktif baru terdeteksi oleh AI').trim()
    }));

  const retiredOrTransferredShips = (
    Array.isArray(rawFleet.retiredOrTransferredShips) ? rawFleet.retiredOrTransferredShips : []
  )
    .filter((s) => s && String(s.name || '').trim())
    .map((s) => ({
      name: String(s.name).trim(),
      reason: String(s.reason || 'Sudah tidak beroperasi pada brand ini').trim()
    }));

  const updatedShips = (Array.isArray(rawFleet.updatedShips) ? rawFleet.updatedShips : [])
    .filter((u) => u && String(u.name || '').trim() && u.patch && typeof u.patch === 'object' && Object.keys(u.patch).length > 0)
    .map((u) => ({
      name: String(u.name).trim(),
      changesSummary: String(u.changesSummary || 'Pembaruan spesifikasi/deployment kapal').trim(),
      patch: u.patch
    }));

  // For single-ship audit, ensure retired flag maps cleanly into retiredOrTransferredShips
  if (mode === 'ship' && ship && safe.isStillOperating === false && retiredOrTransferredShips.length === 0) {
    retiredOrTransferredShips.push({
      name: ship.name,
      reason: safe.summary || 'Kapal terdeteksi tidak lagi aktif beroperasi pada brand ini.'
    });
  }

  const totalActionableChanges =
    fieldChanges.length + newShips.length + retiredOrTransferredShips.length + updatedShips.length;

  let status = VALID_AUDIT_STATUSES.has(safe.status) ? safe.status : 'verified';
  if (totalActionableChanges === 0) {
    status = 'verified';
  } else if (status === 'verified') {
    status = 'update_available';
  }

  return {
    mode,
    guideId: guide?.id || '',
    brandName: guide?.brandName || guide?.brand_name || '',
    shipName: ship?.name || null,
    status,
    summary:
      String(safe.summary || '').trim() ||
      (totalActionableChanges > 0
        ? `Ditemukan ${totalActionableChanges} rekomendasi pembaruan informasi.`
        : 'Seluruh informasi utama & daftar armada kapal terverifikasi akurat.'),
    fieldChanges,
    fleetChanges: {
      newShips,
      retiredOrTransferredShips,
      updatedShips
    },
    totalChanges: totalActionableChanges,
    webGrounded: Boolean(webGrounded),
    sources: Array.isArray(sources) ? sources : [],
    modelUsed: String(modelUsed || ''),
    verificationNotes:
      String(safe.verificationNotes || '').trim() ||
      `Diaudit oleh Cruise AI Agent (${webGrounded ? 'Live Web Search' : 'Gemini Knowledge'})`,
    verifiedAt: new Date().toISOString()
  };
}

const ALLOWED_SHIP_PATCH_KEYS = [
  'shipClass',
  'tonnage',
  'capacity',
  'decks',
  'yearBuilt',
  'deployment',
  'bestFor',
  'highlight'
];

/**
 * Deterministically merges an approved Cruise AI Audit Result onto a Cruise Guide object.
 * Does not mutate the input guide.
 */
export function applyCruiseAuditToGuide(guide, auditResult, { updatedBy = 'Cruise AI Agent' } = {}) {
  if (!guide || !auditResult) return guide;
  const next = {
    ...guide,
    featuredShips: (guide.featuredShips || []).map((s) => ({ ...s }))
  };

  // 1. Apply allowlisted brand field changes (brand mode)
  if (auditResult.mode !== 'ship') {
    (auditResult.fieldChanges || []).forEach((ch) => {
      if (!ALLOWED_BRAND_PATCH_FIELDS.has(ch.field)) return;
      if (
        ['gratuityStandard', 'gratuitySuite', 'minInfantMonths', 'pregnancyMaxWeeks', 'minBookingAge', 'budgetTier'].includes(
          ch.field
        )
      ) {
        const num = Number(ch.newValue);
        if (!Number.isNaN(num) && num >= 0) {
          next[ch.field] = num;
        }
      } else if (['homeports', 'regions', 'targetProfiles', 'typicalDurations'].includes(ch.field)) {
        if (Array.isArray(ch.newValue)) {
          next[ch.field] = ch.newValue.map((x) => String(x || '').trim()).filter(Boolean);
        } else if (typeof ch.newValue === 'string') {
          next[ch.field] = ch.newValue
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean);
        }
      } else if (typeof ch.newValue === 'string' && ch.newValue.trim()) {
        next[ch.field] = ch.newValue.trim();
      }
    });
  } else if (auditResult.shipName && Array.isArray(auditResult.fieldChanges) && auditResult.fieldChanges.length > 0) {
    // Apply single-ship fieldChanges directly onto the targeted ship if patch wasn't populated
    const targetLower = auditResult.shipName.toLowerCase();
    next.featuredShips = next.featuredShips.map((ship) => {
      if (ship.name.toLowerCase() !== targetLower) return ship;
      const patched = { ...ship };
      auditResult.fieldChanges.forEach((ch) => {
        if (ALLOWED_SHIP_PATCH_KEYS.includes(ch.field) && ch.newValue !== undefined && ch.newValue !== '') {
          patched[ch.field] = ch.field === 'decks' ? Number(ch.newValue) || patched.decks : String(ch.newValue).trim();
        }
      });
      return patched;
    });
  }

  // 2. Apply fleet updates (retirements, patches, new ships)
  const fc = auditResult.fleetChanges || {};

  if (Array.isArray(fc.retiredOrTransferredShips) && fc.retiredOrTransferredShips.length > 0) {
    const retiredSet = new Set(fc.retiredOrTransferredShips.map((r) => String(r.name || '').trim().toLowerCase()));
    next.featuredShips = next.featuredShips.filter((s) => !retiredSet.has(s.name.toLowerCase()));
  }

  if (Array.isArray(fc.updatedShips) && fc.updatedShips.length > 0) {
    fc.updatedShips.forEach((upd) => {
      const targetLower = String(upd.name || '').trim().toLowerCase();
      next.featuredShips = next.featuredShips.map((ship) => {
        if (ship.name.toLowerCase() !== targetLower) return ship;
        const patched = { ...ship };
        ALLOWED_SHIP_PATCH_KEYS.forEach((k) => {
          if (upd.patch?.[k] !== undefined && upd.patch[k] !== null && upd.patch[k] !== '') {
            patched[k] = k === 'decks' ? Number(upd.patch[k]) || patched.decks : String(upd.patch[k]).trim();
          }
        });
        return patched;
      });
    });
  }

  if (Array.isArray(fc.newShips) && fc.newShips.length > 0) {
    const existingNames = new Set(next.featuredShips.map((s) => s.name.toLowerCase()));
    const toAdd = [];
    fc.newShips.forEach((ns) => {
      const cleanName = String(ns.name || '').trim();
      if (!cleanName || existingNames.has(cleanName.toLowerCase())) return;
      existingNames.add(cleanName.toLowerCase());
      toAdd.push({
        name: cleanName,
        shipClass: String(ns.shipClass || '').trim(),
        tonnage: String(ns.tonnage || '').trim(),
        capacity: String(ns.capacity || '').trim(),
        decks: ns.decks !== undefined && ns.decks !== '' ? Number(ns.decks) || '' : '',
        yearBuilt: String(ns.yearBuilt || '').trim(),
        deployment: String(ns.deployment || '').trim(),
        bestFor: String(ns.bestFor || '').trim(),
        highlight: String(ns.highlight || '').trim()
      });
    });
    if (toAdd.length > 0) {
      next.featuredShips = [...toAdd, ...next.featuredShips];
    }
  }

  next.lastVerifiedAt = auditResult.verifiedAt || new Date().toISOString();
  next.auditStatus = 'verified';
  next.verificationNotes = auditResult.verificationNotes || 'Terverifikasi oleh Cruise AI Agent';
  next.updatedBy = updatedBy;

  return next;
}

export function getCruiseFreshnessStatus(lastVerifiedAt, auditStatus = 'verified', staleDays = 30) {
  if (auditStatus === 'critical_alert') {
    return { label: 'Alert Kritis AI', tone: '#ef4444', needsCheck: true };
  }
  if (auditStatus === 'update_available') {
    return { label: 'Ada Update AI', tone: '#f59e0b', needsCheck: true };
  }
  if (!lastVerifiedAt) {
    return { label: 'Belum Dicek AI', tone: '#64748b', needsCheck: true };
  }
  const ts = new Date(lastVerifiedAt).getTime();
  if (Number.isNaN(ts)) {
    return { label: 'Belum Dicek AI', tone: '#64748b', needsCheck: true };
  }
  const ageDays = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (ageDays > staleDays) {
    return { label: `Perlu Cek (${ageDays} hari lalu)`, tone: '#f59e0b', needsCheck: true };
  }
  if (ageDays <= 7) {
    return { label: 'Terverifikasi Baru', tone: '#10b981', needsCheck: false };
  }
  return { label: `Segar (${ageDays}h lalu)`, tone: '#0ea5e9', needsCheck: false };
}
