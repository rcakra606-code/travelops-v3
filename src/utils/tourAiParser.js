import { createEmptyPax, computeFinancialsFromPax } from './tourHelpers.js';

const COUNTRY_ALIAS_MAP = {
  korea: 'South Korea',
  'korea selatan': 'South Korea',
  'south korea': 'South Korea',
  incheon: 'South Korea',
  seoul: 'South Korea',
  busan: 'South Korea',
  jeju: 'South Korea',
  jepang: 'Japan',
  japan: 'Japan',
  tokyo: 'Japan',
  osaka: 'Japan',
  hokkaido: 'Japan',
  swiss: 'Switzerland',
  switzerland: 'Switzerland',
  cina: 'China',
  tiongkok: 'China',
  china: 'China',
  beijing: 'China',
  shanghai: 'China',
  inggris: 'United Kingdom',
  uk: 'United Kingdom',
  london: 'United Kingdom',
  prancis: 'France',
  perancis: 'France',
  paris: 'France',
  italia: 'Italy',
  italy: 'Italy',
  jerman: 'Germany',
  germany: 'Germany',
  belanda: 'Netherlands',
  netherlands: 'Netherlands',
  spanyol: 'Spain',
  spain: 'Spain',
  turki: 'Turkey',
  turkiye: 'Turkey',
  turkey: 'Turkey',
  singapura: 'Singapore',
  singapore: 'Singapore',
  amerika: 'United States of America',
  usa: 'United States of America',
  us: 'United States of America',
  'united states': 'United States of America',
  australia: 'Australia',
  selandia: 'New Zealand',
  'new zealand': 'New Zealand',
  thailand: 'Thailand',
  vietnam: 'Vietnam',
  taiwan: 'Taiwan',
  'hong kong': 'Hong Kong',
  hongkong: 'Hong Kong',
  dubai: 'United Arab Emirates',
  uae: 'United Arab Emirates',
  mesir: 'Egypt',
  egypt: 'Egypt',
  finlandia: 'Finland',
  finland: 'Finland',
  norwegia: 'Norway',
  norway: 'Norway',
  swedia: 'Sweden',
  sweden: 'Sweden',
  islandia: 'Iceland',
  iceland: 'Iceland',
  austria: 'Austria',
  ceko: 'Czechia',
  czech: 'Czechia',
  hungaria: 'Hungary',
  hungary: 'Hungary',
  yunani: 'Greece',
  greece: 'Greece',
  kanada: 'Canada',
  canada: 'Canada',
  malaysia: 'Malaysia'
};

export const normalizeCountryName = (rawCountry = '', tourTitle = '') => {
  const clean = String(rawCountry || '').trim();
  if (clean) {
    const exactKey = clean.toLowerCase();
    if (COUNTRY_ALIAS_MAP[exactKey]) return COUNTRY_ALIAS_MAP[exactKey];
    for (const [alias, canonical] of Object.entries(COUNTRY_ALIAS_MAP)) {
      if (exactKey.includes(alias)) return canonical;
    }
    return clean;
  }

  // Fallback: detect destination keyword inside tour title
  const titleLower = String(tourTitle || '').toLowerCase();
  if (titleLower) {
    for (const [alias, canonical] of Object.entries(COUNTRY_ALIAS_MAP)) {
      if (titleLower.includes(alias)) return canonical;
    }
  }
  return '';
};

export const normalizePaxTitle = (rawTitle = '') => {
  const t = String(rawTitle || '')
    .replace(/\./g, '')
    .trim()
    .toLowerCase();
  if (['mr', 'tn', 'bpk', 'bapak'].includes(t)) return 'Mr';
  if (['mrs', 'ny', 'ibu'].includes(t)) return 'Mrs';
  if (['ms', 'sdr', 'sdri'].includes(t)) return 'Ms';
  if (['miss', 'nn', 'nona'].includes(t)) return 'Miss';
  if (['mstr', 'master', 'chd', 'an'].includes(t)) return 'Mstr';
  return 'Mr';
};

/**
 * Matches a raw consultant name or nickname (e.g. "Emil" or "Emil dari cabang Kelapa Gading")
 * against the active non-admin staff list.
 */
export const matchStaffName = (rawStaff = '', activeStaff = [], fallbackName = '') => {
  const staffNames = (activeStaff || [])
    .map((u) => (typeof u === 'string' ? u : u?.name || ''))
    .filter(Boolean);

  const raw = String(rawStaff || '').trim();
  if (!raw) return fallbackName || '';

  const lowerRaw = raw.toLowerCase();

  // 1. Exact case-insensitive match
  const exact = staffNames.find((name) => name.toLowerCase() === lowerRaw);
  if (exact) return exact;

  // Extract leading name token (e.g. "Emil dari cabang Kelapa Gading" -> "emil")
  const primaryToken = lowerRaw
    .split(/\s+(?:dari|from|cabang|branch|\/|-|\()/i)[0]
    .trim();

  if (primaryToken.length >= 2) {
    // 2. Prefix match on full name or first name (e.g. "emil" -> "Emilia Yuninda")
    const prefixMatch = staffNames.find((name) => {
      const nl = name.toLowerCase();
      return nl.startsWith(primaryToken) || nl.split(/\s+/).some((part) => part.startsWith(primaryToken));
    });
    if (prefixMatch) return prefixMatch;

    // 3. Substring match
    const containsMatch = staffNames.find((name) => name.toLowerCase().includes(primaryToken));
    if (containsMatch) return containsMatch;
  }

  return fallbackName || '';
};

const toSafeInt = (val) => {
  if (typeof val === 'number' && Number.isFinite(val)) return Math.max(0, Math.round(val));
  if (!val) return 0;
  const cleaned = String(val).replace(/[^\d.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
};

const toSafeIsoDate = (val) => {
  const s = String(val || '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
};

/**
 * Converts raw Gemini registration-form JSON into a complete, mathematically synced
 * TourWizard draft object (NEVER saved directly to DB — always reviewed by staff first).
 */
export const buildDraftFromAiResult = (
  rawAi = {},
  { activeStaff = [], defaultStaffName = '', fileName = 'Formulir Pendaftaran' } = {}
) => {
  const tourType = ['Series', 'Incentive', 'Consortium'].includes(rawAi.tourType)
    ? rawAi.tourType
    : 'Series';

  const category = ['Leisure', 'Corporate / Incentive', 'Private / FIT', 'Consortium', 'Religious / Pilgrimage'].includes(
    rawAi.category
  )
    ? rawAi.category
    : tourType === 'Consortium'
      ? 'Consortium'
      : tourType === 'Incentive'
        ? 'Corporate / Incentive'
        : 'Leisure';

  const tourTitle = String(rawAi.tourTitle || '').trim();
  const tourCode = String(rawAi.tourCode || '')
    .trim()
    .split(/\s+/)[0]
    .toUpperCase();
  const bookingCode = String(rawAi.bookingCode || '').trim().toUpperCase();
  const country = normalizeCountryName(rawAi.country, tourTitle);
  const departureDate = toSafeIsoDate(rawAi.departureDate);
  const returnDate = toSafeIsoDate(rawAi.returnDate);
  const supplier = String(rawAi.supplier || '').trim();
  const roomingNote = String(rawAi.roomingNote || '').trim();

  const rawFin = rawAi.financials || {};
  const rawPaxList = Array.isArray(rawAi.paxInfo) && rawAi.paxInfo.length > 0 ? rawAi.paxInfo : [];
  const paxCount = Math.max(1, rawPaxList.length || parseInt(rawAi.paxCount, 10) || 1);

  const importantNotes = Array.isArray(rawAi.importantNotes)
    ? rawAi.importantNotes.map((n) => String(n || '').trim()).filter(Boolean)
    : [];

  // Map participants cleanly to Step2PaxInfo shape
  const fallbackUnitBasic =
    rawPaxList.length > 0 && toSafeInt(rawFin.basicTourPrice) > 0 && rawPaxList.every((p) => !toSafeInt(p.basicPrice))
      ? Math.round(toSafeInt(rawFin.basicTourPrice) / paxCount)
      : 0;

  const paxInfo = Array.from({ length: paxCount }, (_, idx) => {
    const src = rawPaxList[idx] || {};
    const base = createEmptyPax(idx);
    const basicPrice = toSafeInt(src.basicPrice) || fallbackUnitBasic;
    const airportTax = toSafeInt(src.airportTax);
    const tipping = toSafeInt(src.tipping);
    const miscCharge = toSafeInt(src.miscCharge);
    const ppn = toSafeInt(src.ppn);
    const discountSupplier = toSafeInt(src.discountSupplier);
    const discountBranch = toSafeInt(src.discountBranch);

    const noteParts = [
      src.notes ? String(src.notes).trim() : '',
      idx === 0 && roomingNote && !String(src.notes || '').toLowerCase().includes(roomingNote.toLowerCase())
        ? `Room: ${roomingNote}`
        : '',
      idx === 0 && rawFin.paymentSummary ? `Payment Note: ${String(rawFin.paymentSummary).trim()}` : ''
    ].filter(Boolean);

    return {
      ...base,
      title: normalizePaxTitle(src.title),
      firstName: String(src.firstName || '').trim(),
      lastName: String(src.lastName || '').trim(),
      phone: String(src.phone || '').trim(),
      email: String(src.email || '').trim(),
      basicPrice: basicPrice || '',
      sellingPrice: basicPrice || '',
      airportTax: airportTax || '',
      tipping: tipping || '',
      miscCharge: miscCharge || '',
      ppn: ppn || '',
      discountSupplier: discountSupplier || '',
      discountBranch: discountBranch || '',
      discount: discountSupplier + discountBranch || '',
      profit: '',
      notes: noteParts.join(' | ')
    };
  });

  // Match consultant name
  const rawStaff = String(rawAi.staffName || '').trim();
  const matchedStaff = matchStaffName(rawStaff, activeStaff, defaultStaffName);

  // Sync financials accurately
  const depositAmount = toSafeInt(rawFin.depositAmount);
  const depositNumber = String(rawFin.depositNumber || '').trim();
  const invoiceNumber = String(rawFin.invoiceNumber || '').trim();

  const seedFinancials = {
    basicTourPrice: toSafeInt(rawFin.basicTourPrice),
    totalSales: toSafeInt(rawFin.basicTourPrice),
    airportTax: toSafeInt(rawFin.airportTax),
    tipping: toSafeInt(rawFin.tipping),
    miscCharge: toSafeInt(rawFin.miscCharge),
    ppn: toSafeInt(rawFin.ppn),
    discountSupplier: toSafeInt(rawFin.discountSupplier),
    discountBranch: toSafeInt(rawFin.discountBranch),
    discount: toSafeInt(rawFin.discountSupplier) + toSafeInt(rawFin.discountBranch),
    profit: 0,
    depositNumber,
    depositAmount,
    invoiceNumber,
    discountLink: ''
  };

  const hasPaxPrice = paxInfo.some((p) => toSafeInt(p.basicPrice) > 0);
  const computedFin = hasPaxPrice
    ? computeFinancialsFromPax(paxInfo, seedFinancials, tourType)
    : {
        ...seedFinancials,
        totalSellingPrice:
          seedFinancials.basicTourPrice +
          (tourType === 'Consortium'
            ? seedFinancials.airportTax + seedFinancials.tipping + seedFinancials.miscCharge + seedFinancials.ppn
            : 0) -
          seedFinancials.discountSupplier -
          seedFinancials.discountBranch,
        totalOmset:
          seedFinancials.basicTourPrice +
          (tourType === 'Consortium'
            ? seedFinancials.airportTax + seedFinancials.tipping + seedFinancials.miscCharge + seedFinancials.ppn
            : 0) -
          seedFinancials.discountSupplier -
          seedFinancials.discountBranch,
        totalNettPrice:
          seedFinancials.basicTourPrice - seedFinancials.discountSupplier - seedFinancials.discountBranch,
        cost: seedFinancials.basicTourPrice - seedFinancials.discountSupplier - seedFinancials.discountBranch,
        sisaPelunasan:
          seedFinancials.basicTourPrice -
          seedFinancials.discountSupplier -
          seedFinancials.discountBranch -
          depositAmount
      };

  // Assemble proactive warnings
  const warnings = Array.isArray(rawAi.warnings)
    ? rawAi.warnings.map((w) => String(w || '').trim()).filter(Boolean)
    : [];

  if (rawStaff && !matchedStaff) {
    warnings.push(
      `Nama PIC "${rawStaff}" di dokumen belum cocok dengan daftar staf aktif — silakan pilih PIC Staff secara manual.`
    );
  }
  if (!country) {
    warnings.push('Negara destinasi belum terdeteksi otomatis — harap pilih pada Step 2.');
  }
  if (!departureDate) {
    warnings.push('Tanggal keberangkatan belum terbaca jelas — harap verifikasi pada Step 2.');
  }

  return {
    _seedKey: `ai-draft-${Date.now()}`,
    tourType,
    supplier,
    tourCode,
    bookingCode,
    departureDate,
    returnDate,
    country,
    category,
    paxCount,
    staffName: matchedStaff,
    status: 'Pending',
    claimMdr: false,
    claimMdrAt: null,
    claimMdrBy: '',
    paxInfo,
    financials: computedFin,
    _aiMeta: {
      fileName,
      tourTitle,
      roomingNote,
      rawStaff,
      paymentSummary: String(rawFin.paymentSummary || '').trim(),
      confidence: ['high', 'medium', 'low'].includes(rawAi.confidence) ? rawAi.confidence : 'medium',
      warnings,
      importantNotes,
      parsedAt: new Date().toISOString()
    }
  };
};
