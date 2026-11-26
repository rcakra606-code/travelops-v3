/**
 * Pure Logic Helpers for Cruise Sales Guide:
 * - DB <-> UI normalization
 * - Smart Client Profiler recommender
 * - Extra cost / Gratuity calculator
 * - WhatsApp client briefing formatters
 */
import {
  CABIN_CATEGORIES,
  CLIENT_PROFILES,
  COMPLIANCE_RULES,
  CRUISE_REGIONS,
  DEFAULT_FX_RATES,
  PRE_SAILING_TIMELINE
} from './cruiseSalesGuideData.js';

const toStrArray = (val) => {
  if (Array.isArray(val)) return val.map((v) => String(v || '').trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(/\r?\n|,\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};

const toShipArray = (val) => {
  if (!Array.isArray(val)) return [];
  return val
    .map((s) => {
      if (typeof s === 'string') {
        return {
          name: s.trim(),
          shipClass: '',
          tonnage: '',
          capacity: '',
          decks: '',
          yearBuilt: '',
          deployment: '',
          bestFor: '',
          highlight: ''
        };
      }
      return {
        name: String(s?.name || '').trim(),
        shipClass: String(s?.shipClass ?? s?.ship_class ?? '').trim(),
        tonnage: String(s?.tonnage || '').trim(),
        capacity: String(s?.capacity || '').trim(),
        decks: s?.decks !== undefined && s?.decks !== null && s?.decks !== '' ? Number(s.decks) || String(s.decks) : '',
        yearBuilt: String(s?.yearBuilt ?? s?.year_built ?? '').trim(),
        deployment: String(s?.deployment || '').trim(),
        bestFor: String(s?.bestFor ?? s?.best_for ?? '').trim(),
        highlight: String(s?.highlight || '').trim()
      };
    })
    .filter((s) => s.name);
};

export const parseTonnageNumber = (tonnageStr) => {
  const digits = String(tonnageStr || '').replace(/[^0-9]/g, '');
  return digits ? Number(digits) : 0;
};

export const parseLaunchYear = (yearStr) => {
  const match = String(yearStr || '').match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : 0;
};

export const getShipSizeCategory = (tonnageStr) => {
  const gt = parseTonnageNumber(tonnageStr);
  if (!gt) return 'unknown';
  if (gt >= 150000) return 'mega';
  if (gt >= 100000) return 'large';
  if (gt >= 60000) return 'midsize';
  return 'boutique';
};

export const SHIP_SIZE_LABELS = {
  mega: 'Mega-Ship (>150k GT)',
  large: 'Besar (100k–150k GT)',
  midsize: 'Menengah (60k–100k GT)',
  boutique: 'Butik & Ekspedisi (<60k GT)',
  unknown: 'Ukuran Standar'
};

export const flattenAllShips = (guides = []) => {
  const list = [];
  (guides || []).forEach((guide) => {
    if (!guide || guide.isActive === false) return;
    (guide.featuredShips || []).forEach((ship, index) => {
      if (!ship?.name) return;
      list.push({
        key: `${guide.id}::${ship.name}::${index}`,
        ship,
        guide,
        tonnageNum: parseTonnageNumber(ship.tonnage),
        launchYear: parseLaunchYear(ship.yearBuilt),
        sizeCategory: getShipSizeCategory(ship.tonnage)
      });
    });
  });
  return list;
};

export const filterFleetShips = (
  allShips = [],
  { brandId = 'all', sizeCategory = 'all', query = '', sortBy = 'brand' } = {}
) => {
  const q = String(query || '').trim().toLowerCase();
  const filtered = (allShips || []).filter((entry) => {
    if (brandId !== 'all' && entry.guide.id !== brandId) return false;
    if (sizeCategory !== 'all' && entry.sizeCategory !== sizeCategory) return false;
    if (!q) return true;
    const hay = [
      entry.ship.name,
      entry.ship.shipClass,
      entry.ship.deployment,
      entry.ship.bestFor,
      entry.ship.highlight,
      entry.ship.yearBuilt,
      entry.guide.brandName,
      entry.guide.halalStatus,
      entry.guide.segment
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });

  const sorted = [...filtered];
  if (sortBy === 'newest') {
    sorted.sort((a, b) => b.launchYear - a.launchYear || b.tonnageNum - a.tonnageNum);
  } else if (sortBy === 'largest') {
    sorted.sort((a, b) => b.tonnageNum - a.tonnageNum || a.ship.name.localeCompare(b.ship.name));
  } else if (sortBy === 'alpha') {
    sorted.sort((a, b) => a.ship.name.localeCompare(b.ship.name));
  }
  return sorted;
};

export const slugifyGuideId = (brandName) =>
  String(brandName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `cruise-${Date.now()}`;

export const normalizeCruiseGuide = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const brandName = String(raw.brand_name ?? raw.brandName ?? '').trim();
  if (!brandName) return null;

  return {
    id: String(raw.id || slugifyGuideId(brandName)),
    brandName,
    tagline: String(raw.tagline || '').trim(),
    segment: String(raw.segment || 'Family').trim(),
    budgetTier: Math.min(5, Math.max(1, Number(raw.budget_tier ?? raw.budgetTier ?? 3) || 3)),
    featuredShips: toShipArray(raw.featured_ships ?? raw.featuredShips),
    homeports: toStrArray(raw.homeports),
    regions: toStrArray(raw.regions),
    targetProfiles: toStrArray(raw.target_profiles ?? raw.targetProfiles),
    halalStatus: String(raw.halal_status ?? raw.halalStatus ?? 'Pre-Order Halal').trim(),
    halalNotes: String(raw.halal_notes ?? raw.halalNotes ?? '').trim(),
    gratuityCurrency: String(raw.gratuity_currency ?? raw.gratuityCurrency ?? 'USD').trim(),
    gratuityStandard: Number(raw.gratuity_standard ?? raw.gratuityStandard ?? 0) || 0,
    gratuitySuite: Number(raw.gratuity_suite ?? raw.gratuitySuite ?? 0) || 0,
    gratuityNotes: String(raw.gratuity_notes ?? raw.gratuityNotes ?? '').trim(),
    minInfantMonths: Number(raw.min_infant_months ?? raw.minInfantMonths ?? 6) || 6,
    pregnancyMaxWeeks: Number(raw.pregnancy_max_weeks ?? raw.pregnancyMaxWeeks ?? 23) || 23,
    minBookingAge: Number(raw.min_booking_age ?? raw.minBookingAge ?? 18) || 18,
    vipClubName: String(raw.vip_club_name ?? raw.vipClubName ?? '').trim(),
    typicalDurations: toStrArray(raw.typical_durations ?? raw.typicalDurations),
    highlights: toStrArray(raw.highlights),
    inclusions: toStrArray(raw.inclusions),
    salesTips: toStrArray(raw.sales_tips ?? raw.salesTips),
    dressCode: String(raw.dress_code ?? raw.dressCode ?? '').trim(),
    websiteUrl: String(raw.website_url ?? raw.websiteUrl ?? '').trim(),
    accentColor: String(raw.accent_color ?? raw.accentColor ?? '#0ea5e9').trim(),
    sortOrder: Number(raw.sort_order ?? raw.sortOrder ?? 100) || 100,
    isActive: raw.is_active !== false && raw.isActive !== false,
    lastVerifiedAt: raw.last_verified_at ?? raw.lastVerifiedAt ?? raw.updated_at ?? raw.updatedAt ?? null,
    auditStatus: String(raw.audit_status ?? raw.auditStatus ?? 'verified').trim(),
    verificationNotes: String(raw.verification_notes ?? raw.verificationNotes ?? '').trim(),
    updatedBy: String(raw.updated_by ?? raw.updatedBy ?? 'System Seed').trim(),
    updatedAt: raw.updated_at ?? raw.updatedAt ?? null
  };
};

export const toCruiseGuideDbPayload = (guide, updatedBy = 'Admin') => {
  const n = normalizeCruiseGuide(guide);
  if (!n) throw new Error('Nama brand kapal pesiar wajib diisi.');
  return {
    id: n.id,
    brand_name: n.brandName,
    tagline: n.tagline,
    segment: n.segment,
    budget_tier: n.budgetTier,
    featured_ships: n.featuredShips,
    homeports: n.homeports,
    regions: n.regions,
    target_profiles: n.targetProfiles,
    halal_status: n.halalStatus,
    halal_notes: n.halalNotes,
    gratuity_currency: n.gratuityCurrency,
    gratuity_standard: n.gratuityStandard,
    gratuity_suite: n.gratuitySuite,
    gratuity_notes: n.gratuityNotes,
    min_infant_months: n.minInfantMonths,
    pregnancy_max_weeks: n.pregnancyMaxWeeks,
    min_booking_age: n.minBookingAge,
    vip_club_name: n.vipClubName,
    typical_durations: n.typicalDurations,
    highlights: n.highlights,
    inclusions: n.inclusions,
    sales_tips: n.salesTips,
    dress_code: n.dressCode,
    website_url: n.websiteUrl,
    accent_color: n.accentColor,
    sort_order: n.sortOrder,
    is_active: n.isActive,
    last_verified_at: n.lastVerifiedAt || new Date().toISOString(),
    audit_status: n.auditStatus || 'verified',
    verification_notes: n.verificationNotes || '',
    updated_by: updatedBy || n.updatedBy || 'Admin',
    updated_at: new Date().toISOString()
  };
};

export const formatIdr = (amount) => {
  const rounded = Math.round(Number(amount) || 0);
  return `Rp ${rounded.toLocaleString('id-ID')}`;
};

export const formatBudgetTier = (tier) => '$'.repeat(Math.min(5, Math.max(1, Number(tier) || 3)));

export const formatGratuityBadge = (guide) => {
  if (!guide) return '—';
  if (guide.gratuityCurrency === 'Included' || (guide.gratuityStandard === 0 && guide.gratuitySuite === 0)) {
    return 'All-Inclusive (Termasuk)';
  }
  const std = Number(guide.gratuityStandard || 0).toFixed(guide.gratuityStandard % 1 === 0 ? 0 : 2);
  return `${guide.gratuityCurrency} ${std}/pax/mlm`;
};

export const getRegionLabel = (regionId) =>
  CRUISE_REGIONS.find((r) => r.id === regionId)?.shortLabel || regionId;

export const getProfileLabel = (profileId) =>
  CLIENT_PROFILES.find((p) => p.id === profileId)?.label || profileId;

/**
 * Scores & ranks cruise guides for the "Cocokkan Kapal untuk Klien" quick recommender.
 */
export const recommendCruises = (guides = [], { profile = 'all', region = 'all', query = '' } = {}) => {
  const q = String(query || '').trim().toLowerCase();

  return (guides || [])
    .filter((g) => g && g.isActive !== false)
    .map((guide) => {
      let score = 0;
      const matchReasons = [];

      if (profile && profile !== 'all') {
        const hasProfile = (guide.targetProfiles || []).includes(profile);
        if (!hasProfile) {
          // Special fallback: Halal filter still allows Pre-Order Halal with lower score
          if (profile === 'halal' && guide.halalStatus === 'Pre-Order Halal') {
            score += 20;
            matchReasons.push('Tersedia opsi Pre-Order Halal (H-45/H-60)');
          } else {
            return null;
          }
        } else {
          score += 50;
          if (profile === 'halal' && guide.halalStatus === 'Certified Halal Kitchen') {
            score += 35;
            matchReasons.push('Dapur bersertifikat Halal resmi (JAKIM)');
          } else {
            matchReasons.push(`Cocok untuk segmen ${getProfileLabel(profile)}`);
          }
        }
      }

      if (region && region !== 'all') {
        if (!(guide.regions || []).includes(region)) return null;
        score += 40;
        matchReasons.push(`Aktif melayani rute ${getRegionLabel(region)}`);
      }

      if (q) {
        const haystack = [
          guide.brandName,
          guide.tagline,
          guide.segment,
          guide.halalStatus,
          guide.halalNotes,
          guide.vipClubName,
          ...(guide.homeports || []),
          ...(guide.highlights || []),
          ...(guide.salesTips || []),
          ...(guide.featuredShips || []).map((s) => `${s.name} ${s.highlight}`)
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(q)) return null;
        score += 25;
      }

      // Bonus for flagship homeport Singapore relevance & sort priority
      score += Math.max(0, 15 - Math.floor((guide.sortOrder || 100) / 10));

      return { guide, score, matchReasons };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || (a.guide.sortOrder || 100) - (b.guide.sortOrder || 100));
};

/**
 * Calculates transparent estimated extra costs (Gratuities + Optional Add-Ons) in original currency & IDR.
 */
export const calculateCruiseExtras = ({
  guide,
  nights = 3,
  pax = 2,
  cabinTier = 'standard',
  includeWifi = false,
  wifiPerDayUsd = 22,
  includeBeverage = false,
  beveragePerDayUsd = 55,
  includeTransfer = false,
  transferPerPaxIdr = 450000,
  includeInsurance = false,
  insurancePerPaxIdr = 350000,
  fxRates = DEFAULT_FX_RATES
} = {}) => {
  const safeNights = Math.max(1, Math.min(60, Number(nights) || 1));
  const safePax = Math.max(1, Math.min(50, Number(pax) || 1));
  const rates = { ...DEFAULT_FX_RATES, ...(fxRates || {}) };

  const currency = guide?.gratuityCurrency || 'USD';
  const isAllInclusive = currency === 'Included';
  const gratuityRatePerNight = isAllInclusive
    ? 0
    : cabinTier === 'suite'
      ? Number(guide?.gratuitySuite || guide?.gratuityStandard || 0)
      : Number(guide?.gratuityStandard || 0);

  const gratuityOriginalTotal = Number((gratuityRatePerNight * safeNights * safePax).toFixed(2));
  const gratuityFx = isAllInclusive ? 0 : Number(rates[currency] || rates.USD);
  const gratuityIdr = Math.round(gratuityOriginalTotal * gratuityFx);

  const wifiUsdTotal = includeWifi && !isAllInclusive ? Number((Number(wifiPerDayUsd || 0) * safeNights * safePax).toFixed(2)) : 0;
  const wifiIdr = Math.round(wifiUsdTotal * Number(rates.USD));

  const beverageUsdTotal =
    includeBeverage && !isAllInclusive ? Number((Number(beveragePerDayUsd || 0) * safeNights * safePax).toFixed(2)) : 0;
  const beverageIdr = Math.round(beverageUsdTotal * Number(rates.USD));

  const transferIdr = includeTransfer ? Math.round(Number(transferPerPaxIdr || 0) * safePax) : 0;
  const insuranceIdr = includeInsurance ? Math.round(Number(insurancePerPaxIdr || 0) * safePax) : 0;

  const totalIdr = gratuityIdr + wifiIdr + beverageIdr + transferIdr + insuranceIdr;
  const perPaxIdr = Math.round(totalIdr / safePax);

  return {
    brandName: guide?.brandName || 'Cruise',
    nights: safeNights,
    pax: safePax,
    cabinTier,
    isAllInclusive,
    gratuity: {
      currency,
      ratePerNight: gratuityRatePerNight,
      originalTotal: gratuityOriginalTotal,
      fxRate: gratuityFx,
      idr: gratuityIdr
    },
    wifi: {
      included: Boolean(includeWifi),
      usdTotal: wifiUsdTotal,
      idr: wifiIdr
    },
    beverage: {
      included: Boolean(includeBeverage),
      usdTotal: beverageUsdTotal,
      idr: beverageIdr
    },
    transfer: {
      included: Boolean(includeTransfer),
      idr: transferIdr
    },
    insurance: {
      included: Boolean(includeInsurance),
      idr: insuranceIdr
    },
    totalIdr,
    perPaxIdr
  };
};

// ---------------- WhatsApp Client Briefing Formatters ----------------

export const buildShipWhatsAppBriefing = (guide) => {
  if (!guide) return '';
  const ships = (guide.featuredShips || [])
    .map((s) => `• *${s.name}*${s.highlight ? ` — ${s.highlight}` : ''}`)
    .join('\n');
  const highlights = (guide.highlights || [])
    .slice(0, 4)
    .map((h) => `✅ ${h}`)
    .join('\n');

  return [
    `🚢 *INFORMASI KAPAL PESIAR — ${guide.brandName.toUpperCase()}*`,
    guide.tagline ? `_${guide.tagline}_` : '',
    '',
    `📌 *Profil Singkat:*`,
    `• Segmen: ${guide.segment} (${formatBudgetTier(guide.budgetTier)})`,
    `• Homeport Utama: ${(guide.homeports || []).join(', ') || '-'}`,
    `• Durasi Populer: ${(guide.typicalDurations || []).join(' / ') || '-'}`,
    `• Status Halal: *${guide.halalStatus}*`,
    `• Estimasi Gratuity/Tipping: ${formatGratuityBadge(guide)}`,
    guide.vipClubName ? `• Layanan VIP Suite: ${guide.vipClubName}` : '',
    '',
    ships ? `⚓ *Kapal Unggulan:*\n${ships}\n` : '',
    highlights ? `✨ *Keunggulan Utama:*\n${highlights}\n` : '',
    `🍽️ *Catatan Halal / Dietary:*\n${guide.halalNotes || '-'}`,
    '',
    `📋 *Ketentuan Dasar:* Paspor minimal 6 bulan dari tanggal pulang, bayi min. ${guide.minInfantMonths} bulan, ibu hamil maks. ${guide.pregnancyMaxWeeks} minggu.`,
    '',
    '_Info jadwal keberangkatan & harga promo terbaru siap kami bantu cekkan, Bapak/Ibu!_'
  ]
    .filter((line) => line !== undefined && line !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const buildIndividualShipWhatsAppBriefing = (guide, ship) => {
  if (!guide || !ship) return '';
  return [
    `🚢 *SPESIFIKASI KAPAL — ${ship.name.toUpperCase()}*`,
    `Brand: *${guide.brandName}*${ship.shipClass ? ` (${ship.shipClass})` : ''}`,
    '',
    '📐 *Profil Kapal:*',
    ship.tonnage ? `• Tonase: ${ship.tonnage}` : '',
    ship.capacity ? `• Kapasitas Tamu: ${ship.capacity}` : '',
    ship.decks ? `• Jumlah Deck: ${ship.decks} deck` : '',
    ship.yearBuilt ? `• Tahun Operasi: ${ship.yearBuilt}` : '',
    ship.deployment ? `• Wilayah / Homeport Utama: ${ship.deployment}` : '',
    ship.bestFor ? `• Paling Cocok Untuk: ${ship.bestFor}` : '',
    '',
    ship.highlight ? `✨ *Daya Tarik & Fasilitas Ikonik:*\n${ship.highlight}\n` : '',
    `🌙 *Status Halal / Dietary:* *${guide.halalStatus}* — ${guide.halalNotes || '-'}`,
    `💵 *Estimasi Gratuity/Tipping:* ${formatGratuityBadge(guide)}`,
    `📋 *Ketentuan Dasar:* Paspor min. 6 bulan, bayi min. ${guide.minInfantMonths} bulan, ibu hamil maks. ${guide.pregnancyMaxWeeks} minggu.`,
    '',
    `_Tertarik berlayar dengan *${ship.name}*? Saya bantu cekkan jadwal keberangkatan & pilihan kabin terbaiknya ya, Bapak/Ibu!_`
  ]
    .filter((line) => line !== undefined && line !== null && line !== '')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

export const buildComparisonWhatsAppBriefing = (guides = []) => {
  const valid = (guides || []).filter(Boolean);
  if (valid.length === 0) return '';

  const header = `⚖️ *PERBANDINGAN KAPAL PESIAR (${valid.map((g) => g.brandName).join(' vs ')})*\n`;
  const blocks = valid.map((g, idx) => {
    const mainShip = g.featuredShips?.[0]?.name || '-';
    return [
      `*${idx + 1}. ${g.brandName}* (${g.segment} · ${formatBudgetTier(g.budgetTier)})`,
      `• Kapal Unggulan: ${mainShip}`,
      `• Homeport: ${(g.homeports || []).slice(0, 2).join(', ')}`,
      `• Halal: ${g.halalStatus}`,
      `• Gratuity: ${formatGratuityBadge(g)}`,
      `• Highlight: ${g.highlights?.[0] || g.tagline}`
    ].join('\n');
  });

  return `${header}\n${blocks.join('\n\n')}\n\n_Bapak/Ibu paling tertarik dengan yang mana? Saya bantu cekkan jadwal & harga kabin terbaiknya ya!_`;
};

export const buildCabinGuideWhatsAppBriefing = () => {
  const lines = CABIN_CATEGORIES.map(
    (c, idx) =>
      `*${idx + 1}. ${c.name}* (${c.priceLevel} · ${c.sizeRange})\n` +
      `• ${c.subtitle}\n` +
      `• Cocok untuk: ${c.idealFor}`
  );
  return [
    '🛏️ *PANDUAN TIPE KABIN KAPAL PESIAR*',
    '',
    ...lines,
    '',
    '💡 *Tips Memilih Posisi Kamar Anti Mabuk Laut:*',
    '• Pilih area *Mid-Ship (tengah kapal)* & *Deck menengah/bawah* karena paling stabil.',
    '• Untuk keluarga 4–6 orang, bisa request *Connecting Cabin* (2 kamar ada pintu penghubung di dalam — kuota terbatas).',
    '',
    '_Mau saya bantu cekkan selisih harga antara Interior, Oceanview, dan Balcony untuk rencana keberangkatan Bapak/Ibu?_'
  ].join('\n');
};

export const buildExtrasEstimateWhatsAppBriefing = (estimate) => {
  if (!estimate) return '';
  const items = [];
  if (estimate.isAllInclusive) {
    items.push('• Gratuity / Tipping: *SUDAH TERMASUK (All-Inclusive)*');
  } else {
    items.push(
      `• Gratuity (${estimate.cabinTier === 'suite' ? 'Suite' : 'Standar'}): ${estimate.gratuity.currency} ${estimate.gratuity.originalTotal.toLocaleString('en-US')} (≈ ${formatIdr(estimate.gratuity.idr)})`
    );
  }
  if (estimate.wifi.included && estimate.wifi.idr > 0) {
    items.push(`• Est. Paket WiFi: USD ${estimate.wifi.usdTotal.toLocaleString('en-US')} (≈ ${formatIdr(estimate.wifi.idr)})`);
  }
  if (estimate.beverage.included && estimate.beverage.idr > 0) {
    items.push(`• Est. Paket Minuman: USD ${estimate.beverage.usdTotal.toLocaleString('en-US')} (≈ ${formatIdr(estimate.beverage.idr)})`);
  }
  if (estimate.transfer.included && estimate.transfer.idr > 0) {
    items.push(`• Est. Transfer Bandara–Pelabuhan: ${formatIdr(estimate.transfer.idr)}`);
  }
  if (estimate.insurance.included && estimate.insurance.idr > 0) {
    items.push(`• Est. Asuransi Perjalanan: ${formatIdr(estimate.insurance.idr)}`);
  }

  return [
    `🧮 *ESTIMASI BIAYA TAMBAHAN CRUISE — ${estimate.brandName.toUpperCase()}*`,
    `Durasi: *${estimate.nights} Malam* · Peserta: *${estimate.pax} Pax*`,
    '',
    ...items,
    '',
    `💰 *Perkiraan Total Tambahan:* ${formatIdr(estimate.totalIdr)} *(± ${formatIdr(estimate.perPaxIdr)} / orang)*`,
    '',
    '_Catatan: Estimasi bersifat indikatif mengikuti kurs berjalan & ketentuan terbaru dari pihak kapal (di luar tiket pesawat & visa bila diperlukan)._'
  ].join('\n');
};

export const buildPreSailingChecklistWhatsApp = () => {
  const rules = COMPLIANCE_RULES.map((r) => `• *${r.title}:* ${r.summary.replace(/\*\*/g, '')}`);
  const steps = PRE_SAILING_TIMELINE.map((t) => `${t.step}. *${t.timing} — ${t.title}:* ${t.detail}`);
  return [
    '✅ *CHECKLIST & ATURAN WAJIB SEBELUM BERLAYAR (CRUISE)*',
    '',
    '📌 *Ketentuan Penting Penumpang:*',
    ...rules,
    '',
    '🗓️ *Alur Persiapan Sebelum Hari-H:*',
    ...steps,
    '',
    '_Jika ada pertanyaan seputar paspor, visa, atau permintaan makanan khusus, silakan kabari kami ya Bapak/Ibu!_'
  ].join('\n');
};
