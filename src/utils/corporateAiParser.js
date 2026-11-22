/**
 * Corporate Accounts Excel/CSV AI Auto-Input Parser, Normalizer,
 * Multi-Row Continuation Merger, CustCode Deduplicator & Template Generator.
 *
 * Handles complex real-world Indonesian corporate spreadsheets:
 * - 1 to 3 row merged hierarchical headers (Flight/Hotel Domestic/Intl/Reissued/Refund/Void/Revalidate + KAI)
 * - Multi-row continuation blocks per CustCode (multiple PICs, emails, airline codes, return/intl fee notes)
 * - Embedded phone numbers inside PIC names ("IBU MEI MEI (089651346555)", "Diah : 0812...", "PAK A (0812) / PAK B (0813)")
 * - Decimal percentages (0.03 -> 3%), "+ 11% PPn" suffixes, Rp/IDR/Juta/Miliar/rb formats, "NaN"/"Free"/"TBA"
 * - Automatic CustCode duplicate merging (both intra-file AND against existing Supabase accounts),
 *   discarding 100% identical details while preserving every unique non-duplicate detail!
 */

import {
  CORPORATE_FEE_KEYS,
  parseCommaNumber,
  parseFeeEntry,
  serializeFeeProfile
} from './corporateFeeHelpers.js';
import {
  normalizePicContacts,
  picContactsToLegacyFields,
  mergePicContacts
} from './corporatePicHelpers.js';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
  'ymail.com'
]);

const PLACEHOLDER_REGEX = /^(?:-|–|—|n\/a|na|none|null|nan|undefined|kosong|tba|tbd|free|gratis)$/i;
const DEFAULT_FEE_PROFILE = serializeFeeProfile({});

export function cleanCellText(val) {
  if (val === null || val === undefined) return '';
  const str = String(val)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!str || /^nan$/i.test(str) || /^null$/i.test(str) || /^undefined$/i.test(str)) {
    return '';
  }
  return str;
}

export function cleanAccountCode(val) {
  const txt = cleanCellText(val);
  if (!txt) return '';
  return txt.replace(/\s+/g, '').toUpperCase();
}

/**
 * Normalizes any messy Indonesian/English currency string into an integer IDR value.
 */
export function parseFlexibleIdrAmount(raw) {
  if (raw === null || raw === undefined || raw === '') return 0;
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
  }

  const str = cleanCellText(raw);
  if (!str || PLACEHOLDER_REGEX.test(str) || /^unlimited$/i.test(str)) return 0;

  // Detect Indonesian/English scale suffixes (Miliar/M/B, Juta/jt/mio, Ribu/rb/k)
  const suffixMatch = str.match(
    /(?:rp\.?\s*|idr\s*)?([0-9]+(?:[.,][0-9]+)?)\s*(miliar|milyar|billion|m\b|juta|jt|mio|million|ribu|rb|k\b)/i
  );
  if (suffixMatch) {
    const numVal = parseFloat(suffixMatch[1].replace(',', '.'));
    const unit = suffixMatch[2].toLowerCase();
    if (Number.isFinite(numVal) && numVal > 0) {
      if (unit === 'miliar' || unit === 'milyar' || unit === 'billion' || unit === 'm') {
        return Math.round(numVal * 1_000_000_000);
      }
      if (unit === 'juta' || unit === 'jt' || unit === 'mio' || unit === 'million') {
        return Math.round(numVal * 1_000_000);
      }
      if (unit === 'ribu' || unit === 'rb' || unit === 'k') {
        return Math.round(numVal * 1_000);
      }
    }
  }

  // Extract first currency/number segment before any slash/unit like "/One Way", "/R/N", "/PAX"
  const primarySegment = str.split('/')[0].trim();
  const stripped = primarySegment.replace(/^(?:dom\s*[:=-]?\s*|intl?\s*[:=-]?\s*)?(?:rp\.?|idr)\s*/i, '').trim();

  if (/^\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?/.test(stripped)) {
    const m = stripped.match(/^(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?)/);
    return Math.round(parseFloat(m[1].replace(/,/g, '')));
  }
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?/.test(stripped)) {
    const m = stripped.match(/^(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/);
    return Math.round(parseFloat(m[1].replace(/\./g, '').replace(',', '.')));
  }
  if (/^\d+(?:\.\d{1,2})$/.test(stripped)) {
    return Math.round(parseFloat(stripped));
  }

  const firstNum = stripped.match(/^(\d+(?:[.,]\d{3})*)/);
  if (firstNum) {
    return parseCommaNumber(firstNum[1]);
  }

  return parseCommaNumber(primarySegment);
}

/**
 * Strips trailing VAT/PPn clauses ("+ 11%PPn", "+ 10% PPn", "+ 11%", "+ 11 Ppn")
 * so the base fee unit (Rp nominal vs % percent) is never misidentified.
 */
function stripVatSuffix(text) {
  return String(text || '')
    .replace(/\+\s*\d+(?:[.,]\d+)?\s*%?\s*(?:ppn|vat|tax)?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a single service fee cell (Rp nominal or % percentage) into { type, value }.
 * Handles:
 *  - "Rp 15,000/One Way + 11%PPn" -> { type: 'nominal', value: 15000 }
 *  - "Rp 50,000/R/N + 11%" -> { type: 'nominal', value: 50000 }
 *  - "IDR 15,000 / PAX / TRANSACTION + 11% Ppn" -> { type: 'nominal', value: 15000 }
 *  - "3% + 10% PPn" -> { type: 'percent', value: 3 }
 *  - "2.5% DARI NETT + 11%PPn" -> { type: 'percent', value: 2.5 }
 *  - 0.03 or "0.03" (Excel raw decimal percentage) -> { type: 'percent', value: 3 }
 *  - "DOM: Rp. 50.000" -> { type: 'nominal', value: 50000 }
 *  - "Free" / "TBA" / "If able to reschedule" -> { type: 'nominal', value: 0 }
 */
export function parseFlexibleFeeEntry(raw) {
  if (raw === null || raw === undefined || raw === '') {
    return { type: 'nominal', value: 0 };
  }

  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return parseFeeEntry(raw);
  }

  // Raw numeric decimal between 0 and 1 (e.g. 0.02, 0.025, 0.03, 0.04) -> percentage!
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return { type: 'nominal', value: 0 };
    if (raw > 0 && raw < 1) {
      return { type: 'percent', value: Math.min(100, Math.round(raw * 10000) / 100) };
    }
    return { type: 'nominal', value: Math.round(raw) };
  }

  const str = cleanCellText(raw);
  if (
    !str ||
    PLACEHOLDER_REGEX.test(str) ||
    /^0$/.test(str) ||
    /^if\s+able/i.test(str)
  ) {
    return { type: 'nominal', value: 0 };
  }

  // String decimal between 0 and 1 (e.g. "0.03", "0.025", "0,04")
  if (/^0[.,]\d{1,4}$/.test(str)) {
    const dec = parseFloat(str.replace(',', '.'));
    if (Number.isFinite(dec) && dec > 0 && dec < 1) {
      return { type: 'percent', value: Math.min(100, Math.round(dec * 10000) / 100) };
    }
  }

  // Strip "+ 11% PPn" / "+ 10%" VAT suffix BEFORE checking whether base fee is % or Rp
  const baseText = stripVatSuffix(str);
  if (!baseText) return { type: 'nominal', value: 0 };

  if (baseText.includes('%') || /persen|pct/i.test(baseText)) {
    const match = baseText.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:%|persen|pct)/i) || baseText.match(/([0-9]+(?:[.,][0-9]+)?)/);
    if (match) {
      const pct = parseFloat(match[1].replace(',', '.'));
      if (Number.isFinite(pct) && pct >= 0) {
        return { type: 'percent', value: Math.min(100, Math.round(pct * 100) / 100) };
      }
    }
    return { type: 'percent', value: 0 };
  }

  const amount = parseFlexibleIdrAmount(baseText);
  // Ignore stray bare small numbers (< 100) without Rp/IDR/% prefix (e.g. typo "4" in an otherwise empty fee cell)
  if (amount > 0 && amount < 100 && !/(?:rp\.?|idr)/i.test(baseText)) {
    return { type: 'nominal', value: 0 };
  }
  return { type: 'nominal', value: amount };
}

/**
 * Parses a combined text summary cell like:
 * "Dom Rp 50.000, Intl 2.5%, Reissue 75rb, Refund 50rb, Void 25rb"
 */
export function parseCombinedFeeSummary(summaryText, baseProfile = {}) {
  const profile = serializeFeeProfile(baseProfile);
  if (!summaryText || typeof summaryText !== 'string') return profile;

  const text = cleanCellText(summaryText);
  if (!text) return profile;

  const patterns = [
    { key: 'domestic', regex: /(?:dom(?:estic|estik)?)\s*[:=-]?\s*([^,;\n/]+)/i },
    { key: 'international', regex: /(?:int(?:l|ernational|ernasional)?)\s*[:=-]?\s*([^,;\n/]+)/i },
    { key: 'reissued', regex: /(?:reissu(?:e|ed)?|ubah\s*jadwal|reschedule)\s*[:=-]?\s*([^,;\n/]+)/i },
    { key: 'refund', regex: /(?:refund|batal)\s*[:=-]?\s*([^,;\n/]+)/i },
    { key: 'void', regex: /(?:void)\s*[:=-]?\s*([^,;\n/]+)/i },
    { key: 'revalidate', regex: /(?:reval(?:idate)?)\s*[:=-]?\s*([^,;\n/]+)/i }
  ];

  let matchedAny = false;
  for (const { key, regex } of patterns) {
    const m = text.match(regex);
    if (m && m[1]) {
      const parsed = parseFlexibleFeeEntry(m[1]);
      if (parsed.value > 0) {
        profile[key] = parsed;
        matchedAny = true;
      }
    }
  }

  if (!matchedAny) {
    const flat = parseFlexibleFeeEntry(text);
    if (flat.value > 0) {
      profile.domestic = flat;
      profile.international = flat;
    }
  }

  return serializeFeeProfile(profile);
}

/**
 * Normalizes Indonesian phone / WhatsApp numbers from Excel cells.
 */
export function normalizeCorporatePhone(raw) {
  const str = cleanCellText(raw);
  if (!str || PLACEHOLDER_REGEX.test(str)) return '';

  const digitsOnly = str.replace(/[^\d+]/g, '');
  if (/^8\d{7,13}$/.test(digitsOnly)) {
    return `0${digitsOnly}`;
  }
  if (/^\+?62\s*8\d{7,13}$/.test(digitsOnly) || /^\+?628\d{7,13}$/.test(digitsOnly)) {
    return `0${digitsOnly.replace(/^\+?62/, '')}`;
  }
  if (/^0\d{8,14}$/.test(digitsOnly)) {
    return digitsOnly;
  }
  return str.replace(/\s+/g, ' ');
}

/**
 * Parses complex PIC Booker cells containing names, titles, and embedded phone numbers.
 * Examples:
 *  - "IBU MEI MEI (089651346555)" -> { names: ["IBU MEI MEI"], phones: ["089651346555"] }
 *  - "PAK SAPTONO (081210321292) / PAK ABDUL (081312341082)" -> { names: ["PAK SAPTONO", "PAK ABDUL"], phones: ["081210321292", "081312341082"] }
 *  - "Diah Juniati Pusporini : 08129082859" -> { names: ["Diah Juniati Pusporini"], phones: ["08129082859"] }
 *  - "andina rindani (Gs admin - 085717223124)" -> { names: ["andina rindani (Gs admin)"], phones: ["085717223124"] }
 *  - "LILIS NURJANNAH : +62 878-8704-3214" -> { names: ["LILIS NURJANNAH"], phones: ["087887043214"] }
 *  - "Steven Censuk (62 81372469298)" -> { names: ["Steven Censuk"], phones: ["081372469298"] }
 */
export function parsePicBookerCell(rawCell) {
  const text = cleanCellText(rawCell);
  if (!text || PLACEHOLDER_REGEX.test(text)) {
    return { names: [], phones: [], entries: [] };
  }

  const names = [];
  const phones = [];
  const entries = [];
  const phoneRegex = /(?:\+?62[\s-]*|0|(?<![0-9])8)\d[\d\s-]{7,15}\d/g;

  // Split by "/" ONLY when both sides look like separate people (e.g. "PAK A (0812...) / PAK B (0813...)")
  const segments = text.includes(' / ') || /\)\s*\//.test(text)
    ? text.split(/\s*\/\s*/)
    : [text];

  for (const seg of segments) {
    const trimmedSeg = seg.trim();
    if (!trimmedSeg) continue;

    const segPhones = [];
    const foundPhones = trimmedSeg.match(phoneRegex) || [];
    for (const p of foundPhones) {
      const normalized = normalizeCorporatePhone(p);
      if (normalized && normalized.replace(/\D/g, '').length >= 9) {
        phones.push(normalized);
        segPhones.push(normalized);
      }
    }

    // Remove extracted phone strings and clean leftover punctuation/empty parens
    let cleanedName = trimmedSeg
      .replace(phoneRegex, ' ')
      .replace(/\(\s*[-:,/]*\s*\)/g, ' ')
      .replace(/-\s*\)/g, ')')
      .replace(/\(\s*-/g, '(')
      .replace(/[\s,;:\-/]+$/g, '')
      .replace(/^[\s,;:\-/]+/g, '')
      .replace(/\s+\)/g, ')')
      .replace(/\(\s+/g, '(')
      .replace(/\s+/g, ' ')
      .trim();

    // Fix unbalanced trailing ')' from messy cells like "Elisabeth ... GS controller - 0895...),"
    const openCount = (cleanedName.match(/\(/g) || []).length;
    const closeCount = (cleanedName.match(/\)/g) || []).length;
    if (closeCount > openCount) {
      cleanedName = cleanedName.replace(/\)+$/g, '').trim();
    }

    const validName = cleanedName && !PLACEHOLDER_REGEX.test(cleanedName) ? cleanedName : '';
    if (validName) {
      names.push(validName);
    }
    if (validName || segPhones.length > 0) {
      entries.push({
        name: validName,
        phone: segPhones.join(', ')
      });
    }
  }

  return { names, phones, entries };
}

/**
 * Splits emails into office vs personal arrays cleanly, stripping "NaN" & extra text like "up to Ibu Ririh".
 */
export function classifyCorporateEmails(officeRaw = '', personalRaw = '', combinedRaw = '') {
  const extractEmails = (val) => {
    const cleaned = cleanCellText(val);
    if (!cleaned) return [];
    const matches = cleaned.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    return matches ? matches.map((e) => e.trim().toLowerCase()) : [];
  };

  const officeSet = new Set();
  const personalSet = new Set();

  // From explicit office column: put non-personal in office, or if personal and no corporate domain, keep in office if primary
  const rawOfficeList = extractEmails(officeRaw);
  const rawPersonalList = extractEmails(personalRaw);
  const rawCombinedList = extractEmails(combinedRaw);

  for (const email of rawOfficeList) {
    const domain = email.split('@')[1] || '';
    if (PERSONAL_EMAIL_DOMAINS.has(domain) && rawOfficeList.some((e) => !PERSONAL_EMAIL_DOMAINS.has(e.split('@')[1] || ''))) {
      personalSet.add(email);
    } else if (PERSONAL_EMAIL_DOMAINS.has(domain) && rawOfficeList.length === 1 && rawPersonalList.length === 0) {
      // Single gmail address listed as primary Contact Email Address (e.g. CBINDA, CFBINA, CSUNTAR) -> keep in office/primary!
      officeSet.add(email);
    } else if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
      personalSet.add(email);
    } else {
      officeSet.add(email);
    }
  }

  for (const email of rawPersonalList) {
    if (!officeSet.has(email)) {
      personalSet.add(email);
    }
  }

  for (const email of rawCombinedList) {
    if (officeSet.has(email) || personalSet.has(email)) continue;
    const domain = email.split('@')[1] || '';
    if (PERSONAL_EMAIL_DOMAINS.has(domain)) {
      personalSet.add(email);
    } else {
      officeSet.add(email);
    }
  }

  return {
    picOfficeEmail: Array.from(officeSet).join(', '),
    picPersonalEmail: Array.from(personalSet).join(', ')
  };
}

export function normalizeAccountStatus(raw) {
  const s = cleanCellText(raw).toLowerCase();
  if (!s) return 'Active';
  if (
    s.includes('inact') ||
    s.includes('non') ||
    s.includes('tidak') ||
    s.includes('close') ||
    s.includes('suspend') ||
    s.includes('block') ||
    s.includes('hold') ||
    s === 'no' ||
    s === '0'
  ) {
    return 'Inactive';
  }
  return 'Active';
}

export function generateFallbackAccountCode(companyName, index = 0) {
  const cleaned = String(companyName || '')
    .replace(/\b(pt|cv|tbk|persero|indonesia|indo|ltd|inc|corp|corporation|group)\b/gi, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  let prefix = 'ACC';
  if (words.length >= 2) {
    prefix = words
      .slice(0, 4)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  } else if (words.length === 1) {
    prefix = words[0].slice(0, 4).toUpperCase();
  }

  return `CORP-${prefix}-${String(index + 1).padStart(2, '0')}`;
}

/**
 * Deduplicates a delimited list of values case-insensitively while preserving original order/casing.
 * Returns { merged: string, droppedDuplicates: number, addedCount: number }.
 */
export function mergeUniqueTokenList(existingStr = '', incomingStr = '', separator = ', ') {
  const splitRegex = separator === ' | ' ? /\s*\|\s*/ : /\s*[,;\n]+\s*/;
  const seen = new Set();
  const result = [];
  let droppedDuplicates = 0;
  let addedCount = 0;

  const normalizeKey = (item) =>
    item
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

  const existingTokens = cleanCellText(existingStr)
    ? String(existingStr).split(splitRegex).map((s) => s.trim()).filter((s) => s && !PLACEHOLDER_REGEX.test(s))
    : [];

  for (const tok of existingTokens) {
    const key = normalizeKey(tok);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(tok);
    }
  }

  const incomingTokens = cleanCellText(incomingStr)
    ? String(incomingStr).split(splitRegex).map((s) => s.trim()).filter((s) => s && !PLACEHOLDER_REGEX.test(s))
    : [];

  for (const tok of incomingTokens) {
    const key = normalizeKey(tok);
    if (seen.has(key)) {
      droppedDuplicates += 1;
    } else {
      seen.add(key);
      result.push(tok);
      addedCount += 1;
    }
  }

  return {
    merged: result.join(separator),
    droppedDuplicates,
    addedCount
  };
}

function areFeeProfilesEqual(a = {}, b = {}) {
  const normA = serializeFeeProfile(a);
  const normB = serializeFeeProfile(b);
  return CORPORATE_FEE_KEYS.every(
    (k) => normA[k].type === normB[k].type && Number(normA[k].value) === Number(normB[k].value)
  );
}

/**
 * Merges two fee profiles: fills zero/empty entries in base from incoming,
 * and overrides with incoming non-zero values if preferIncoming is true.
 */
function mergeFeeProfiles(base = {}, incoming = {}, { preferIncoming = true } = {}) {
  const normBase = serializeFeeProfile(base);
  const normInc = serializeFeeProfile(incoming);
  const merged = {};
  let changedFields = 0;
  let identicalFields = 0;

  for (const k of CORPORATE_FEE_KEYS) {
    const b = normBase[k];
    const inc = normInc[k];

    if (inc.value === 0) {
      merged[k] = b;
      if (b.value === 0) identicalFields += 1;
    } else if (b.value === 0) {
      merged[k] = inc;
      changedFields += 1;
    } else if (b.type === inc.type && b.value === inc.value) {
      merged[k] = b;
      identicalFields += 1;
    } else {
      merged[k] = preferIncoming ? inc : b;
      changedFields += 1;
    }
  }

  return { merged, changedFields, identicalFields };
}

/**
 * Merges two normalized corporate account drafts sharing the same CustCode,
 * dropping 100% identical details and keeping only unique non-duplicate details.
 */
export function mergeCorporateAccountsByCustCode(baseAcc, incomingAcc, { preferIncomingScalar = true } = {}) {
  let droppedIdenticalDetails = 0;
  let newUniqueDetails = 0;

  const basePics = normalizePicContacts(baseAcc.picContacts, baseAcc);
  const incomingPics = normalizePicContacts(incomingAcc.picContacts, incomingAcc);
  const picMerge = mergePicContacts(basePics, incomingPics);
  const mergedLegacyPics = picContactsToLegacyFields(picMerge.merged);

  const airlinesRes = mergeUniqueTokenList(baseAcc.airlinesCode, incomingAcc.airlinesCode, ' | ');
  const remarksRes = mergeUniqueTokenList(baseAcc.remarks, incomingAcc.remarks, ' | ');

  droppedIdenticalDetails +=
    picMerge.droppedDuplicates +
    airlinesRes.droppedDuplicates +
    remarksRes.droppedDuplicates;

  newUniqueDetails +=
    picMerge.addedCount +
    airlinesRes.addedCount +
    remarksRes.addedCount;

  // Address: keep unique addresses separated by " | " only if truly different
  const addressRes = mergeUniqueTokenList(baseAcc.address, incomingAcc.address, ' | ');
  droppedIdenticalDetails += addressRes.droppedDuplicates;
  newUniqueDetails += addressRes.addedCount;

  // Detail Link
  const linkRes = mergeUniqueTokenList(baseAcc.detailLink, incomingAcc.detailLink, ', ');
  droppedIdenticalDetails += linkRes.droppedDuplicates;
  newUniqueDetails += linkRes.addedCount;

  // Company Name
  const baseName = cleanCellText(baseAcc.companyName || baseAcc.corporateName);
  const incName = cleanCellText(incomingAcc.companyName || incomingAcc.corporateName);
  let companyName = baseName || incName;
  if (baseName && incName) {
    if (baseName.toLowerCase() === incName.toLowerCase()) {
      droppedIdenticalDetails += 1;
    } else if (preferIncomingScalar && incName.length > baseName.length) {
      companyName = incName;
      newUniqueDetails += 1;
    }
  } else if (!baseName && incName) {
    newUniqueDetails += 1;
  }

  // Credit Limit
  const baseLimit = Number(baseAcc.creditLimit) || 0;
  const incLimit = Number(incomingAcc.creditLimit) || 0;
  let creditLimit = baseLimit;
  if (incLimit > 0) {
    if (baseLimit === incLimit) {
      droppedIdenticalDetails += 1;
    } else if (baseLimit === 0 || preferIncomingScalar) {
      creditLimit = incLimit;
      newUniqueDetails += 1;
    }
  }

  // Status
  const baseStatus = baseAcc.status || 'Active';
  const incStatus = incomingAcc.status || 'Active';
  let status = baseStatus;
  if (baseStatus === incStatus) {
    droppedIdenticalDetails += 1;
  } else if (preferIncomingScalar) {
    status = incStatus;
    newUniqueDetails += 1;
  }

  // Flight & Hotel Service Fees
  const flightRes = mergeFeeProfiles(baseAcc.flightFee, incomingAcc.flightFee, {
    preferIncoming: preferIncomingScalar
  });
  const hotelRes = mergeFeeProfiles(baseAcc.hotelFee, incomingAcc.hotelFee, {
    preferIncoming: preferIncomingScalar
  });
  newUniqueDetails += flightRes.changedFields + hotelRes.changedFields;
  if (areFeeProfilesEqual(baseAcc.flightFee, incomingAcc.flightFee)) {
    droppedIdenticalDetails += 1;
  }
  if (areFeeProfilesEqual(baseAcc.hotelFee, incomingAcc.hotelFee)) {
    droppedIdenticalDetails += 1;
  }

  return {
    merged: {
      accountCode: cleanAccountCode(baseAcc.accountCode || incomingAcc.accountCode),
      companyName,
      corporateName: companyName,
      address: addressRes.merged,
      creditLimit,
      status,
      picContacts: picMerge.merged,
      picName: mergedLegacyPics.picName,
      picPhone: mergedLegacyPics.picPhone,
      picOfficeEmail: mergedLegacyPics.picOfficeEmail,
      picPersonalEmail: mergedLegacyPics.picPersonalEmail,
      airlinesCode: airlinesRes.merged,
      detailLink: linkRes.merged,
      remarks: remarksRes.merged,
      flightFee: flightRes.merged,
      hotelFee: hotelRes.merged
    },
    droppedIdenticalDetails,
    newUniqueDetails,
    isCompletelyIdentical: newUniqueDetails === 0
  };
}

/**
 * Deterministic heuristic mapper with full support for 1–3 row merged hierarchical headers
 * (including Dwidayatour's 3-row Flight/Hotel/KAI corporate master template!).
 */
export function buildHeuristicColumnMapping(allRows = []) {
  if (!Array.isArray(allRows) || allRows.length === 0) {
    return {
      layoutType: 'tabular_mapping',
      headerRowIndices: [0],
      dataStartRowIndex: 1,
      columnMapping: {},
      columnLabels: {},
      detectionSummary: 'File kosong.',
      warnings: ['Tidak ditemukan baris header yang valid.']
    };
  }

  const HEADER_KEYWORDS = [
    'code', 'kode', 'account', 'akun', 'company', 'corporate', 'perusahaan', 'client',
    'pic', 'booker', 'phone', 'hp', 'telp', 'wa', 'email', 'credit', 'limit', 'plafon',
    'address', 'alamat', 'status', 'airline', 'maskapai', 'fee', 'flight', 'hotel', 'remark', 'note', 'kai', 'tier'
  ];

  // Find top header row within first 8 rows
  let topHeaderIdx = 0;
  let bestScore = -1;
  const maxHeaderScan = Math.min(allRows.length, 8);
  for (let r = 0; r < maxHeaderScan; r += 1) {
    const row = Array.isArray(allRows[r]) ? allRows[r] : [];
    let score = 0;
    for (const cell of row) {
      const lower = cleanCellText(cell).toLowerCase();
      if (lower && HEADER_KEYWORDS.some((kw) => lower.includes(kw))) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      topHeaderIdx = r;
    }
  }

  // Detect 2nd and 3rd hierarchical sub-header rows (e.g. Domestic / International / Reissued / Refund / Void)
  const SUBHEADER_TERMS = /^(domestic|international|reissued?|reschedule|refund|void|revalidate|dom|intl)$/i;
  const headerRowIndices = [topHeaderIdx];
  for (let offset = 1; offset <= 2; offset += 1) {
    const candidateIdx = topHeaderIdx + offset;
    if (candidateIdx >= allRows.length) break;
    const row = Array.isArray(allRows[candidateIdx]) ? allRows[candidateIdx] : [];
    const subMatches = row.filter((c) => SUBHEADER_TERMS.test(cleanCellText(c))).length;
    if (subMatches >= 2) {
      headerRowIndices.push(candidateIdx);
    } else {
      break;
    }
  }

  const dataStartRowIndex = headerRowIndices[headerRowIndices.length - 1] + 1;
  const r0 = Array.isArray(allRows[headerRowIndices[0]]) ? allRows[headerRowIndices[0]] : [];
  const r1 = headerRowIndices[1] !== undefined && Array.isArray(allRows[headerRowIndices[1]]) ? allRows[headerRowIndices[1]] : [];
  const r2 = headerRowIndices[2] !== undefined && Array.isArray(allRows[headerRowIndices[2]]) ? allRows[headerRowIndices[2]] : [];
  const maxCols = Math.max(r0.length, r1.length, r2.length, (allRows[dataStartRowIndex] || []).length);

  // Propagate merged parent headers across empty cells in row 0 & row 1
  const prop0 = [];
  const prop1 = [];
  let cur0 = '';
  let cur1 = '';
  for (let c = 0; c < maxCols; c += 1) {
    const v0 = cleanCellText(r0[c]);
    if (v0) {
      cur0 = v0;
      cur1 = '';
    }
    prop0[c] = cur0;

    const v1 = cleanCellText(r1[c]);
    if (v1) cur1 = v1;
    prop1[c] = v1 || (cleanCellText(r2[c]) ? cur1 : '');
  }

  const columnMapping = {};
  const columnLabels = {};

  for (let c = 0; c < maxCols; c += 1) {
    const raw0 = cleanCellText(r0[c]);
    const raw1 = cleanCellText(r1[c]);
    const raw2 = cleanCellText(r2[c]);
    const g0 = (prop0[c] || '').toLowerCase();
    const g1 = (prop1[c] || '').toLowerCase();
    const g2 = raw2.toLowerCase();
    const fullLabel = [raw0, raw1, raw2].filter(Boolean).join(' ').trim();
    const lower0 = raw0.toLowerCase();

    // Special case: Blank Col 0 containing CustCode values (e.g. CBINDA, CMIGRA, CHEXIN)
    if (c === 0 && !fullLabel) {
      const sampleVal = cleanAccountCode((allRows[dataStartRowIndex] || [])[0]);
      if (sampleVal && /^[A-Z0-9_-]{3,20}$/.test(sampleVal) && !/^\d+$/.test(sampleVal)) {
        columnMapping['0'] = 'accountCode';
        columnLabels['0'] = 'CustCode';
        continue;
      }
    }

    if (!fullLabel && !g1 && !g2) continue;
    columnLabels[String(c)] = fullLabel || `${prop0[c]} ${prop1[c]}`.trim();

    if (/^(no\.?|#|id)$/i.test(lower0)) continue;

    // Hierarchical Flight / Hotel / KAI blocks
    if (g0 === 'flight' || (g0.includes('flight') && (raw1 || raw2))) {
      if (g1.includes('reissu') || g1.includes('resched')) {
        columnMapping[String(c)] = g2.includes('int') ? 'flightFee.reissuedIntl' : 'flightFee.reissued';
      } else if (g1.includes('refund')) {
        columnMapping[String(c)] = g2.includes('int') ? 'flightFee.refundIntl' : 'flightFee.refund';
      } else if (g1.includes('void')) {
        columnMapping[String(c)] = 'flightFee.void';
      } else if (g1.includes('reval')) {
        columnMapping[String(c)] = 'flightFee.revalidate';
      } else if (g1.includes('int')) {
        columnMapping[String(c)] = 'flightFee.international';
      } else if (g1.includes('dom')) {
        columnMapping[String(c)] = 'flightFee.domestic';
      } else {
        columnMapping[String(c)] = 'flightFeeSummary';
      }
      continue;
    }

    if (g0 === 'hotel' || (g0.includes('hotel') && (raw1 || raw2))) {
      if (g1.includes('reissu') || g1.includes('resched')) {
        columnMapping[String(c)] = g2.includes('int') ? 'hotelFee.reissuedIntl' : 'hotelFee.reissued';
      } else if (g1.includes('refund')) {
        columnMapping[String(c)] = g2.includes('int') ? 'hotelFee.refundIntl' : 'hotelFee.refund';
      } else if (g1.includes('void')) {
        columnMapping[String(c)] = 'hotelFee.void';
      } else if (g1.includes('reval')) {
        columnMapping[String(c)] = 'hotelFee.revalidate';
      } else if (g1.includes('int')) {
        columnMapping[String(c)] = 'hotelFee.international';
      } else if (g1.includes('dom')) {
        columnMapping[String(c)] = 'hotelFee.domestic';
      } else {
        columnMapping[String(c)] = 'hotelFeeSummary';
      }
      continue;
    }

    if (g0 === 'kai' || lower0.includes('kereta') || lower0.includes('train')) {
      columnMapping[String(c)] = 'remarksExtra';
      columnLabels[String(c)] = `KAI ${raw1 || 'Domestic'}`.trim();
      continue;
    }

    // Standard flat columns
    if (
      (lower0.includes('code') || lower0.includes('kode') || lower0.includes('cid') || lower0.includes('custcode')) &&
      !lower0.includes('airline') &&
      !lower0.includes('maskapai') &&
      !lower0.includes('postal')
    ) {
      columnMapping[String(c)] = 'accountCode';
    } else if (
      (lower0.includes('airline') || lower0.includes('maskapai')) &&
      !lower0.includes('tier')
    ) {
      columnMapping[String(c)] = 'airlinesCode';
    } else if (lower0.includes('tier') || lower0.includes('entry pricing') || lower0.includes('tour code')) {
      columnMapping[String(c)] = 'airlinesTier';
    } else if (
      lower0.includes('company') ||
      lower0.includes('corporate') ||
      lower0.includes('perusahaan') ||
      lower0.includes('client') ||
      lower0.includes('customer')
    ) {
      columnMapping[String(c)] = 'companyName';
    } else if (lower0.includes('address') || lower0.includes('alamat')) {
      if (lower0.includes('email')) {
        columnMapping[String(c)] = lower0.includes('alternatif') || lower0.includes('alt') || lower0.includes('personal')
          ? 'picPersonalEmail'
          : 'picOfficeEmail';
      } else {
        columnMapping[String(c)] = 'address';
      }
    } else if (lower0.includes('credit') || lower0.includes('limit') || lower0.includes('plafon')) {
      columnMapping[String(c)] = 'creditLimit';
    } else if (lower0.includes('status')) {
      columnMapping[String(c)] = 'status';
    } else if (lower0.includes('link') || lower0.includes('url') || lower0.includes('drive') || lower0.includes('sop')) {
      columnMapping[String(c)] = 'detailLink';
    } else if (lower0.includes('personal') || lower0.includes('pribadi') || lower0.includes('alternatif')) {
      columnMapping[String(c)] = 'picPersonalEmail';
    } else if (lower0.includes('email') || lower0.includes('e-mail')) {
      columnMapping[String(c)] = 'picOfficeEmail';
    } else if (
      lower0.includes('phone') ||
      lower0.includes('hp') ||
      lower0.includes('telp') ||
      lower0.includes('whatsapp') ||
      lower0 === 'wa' ||
      lower0.includes('mobile')
    ) {
      columnMapping[String(c)] = 'picPhone';
    } else if (lower0.includes('pic') || lower0.includes('booker') || lower0.includes('contact')) {
      columnMapping[String(c)] = 'picContactCombined';
    } else if (
      lower0.includes('remark') ||
      lower0.includes('note') ||
      lower0.includes('catatan') ||
      lower0.includes('keterangan')
    ) {
      columnMapping[String(c)] = 'remarks';
    } else if (
      lower0.includes('top') ||
      lower0.includes('term') ||
      lower0.includes('npwp') ||
      lower0.includes('billing') ||
      lower0.includes('sales')
    ) {
      columnMapping[String(c)] = 'remarksExtra';
    }
  }

  return {
    layoutType: 'tabular_mapping',
    headerRowIndices,
    dataStartRowIndex,
    columnMapping,
    columnLabels,
    detectionSummary: `Pemetaan otomatis mendeteksi ${headerRowIndices.length}-baris header dan ${Object.keys(columnMapping).length} kolom corporate (termasuk Flight, Hotel, PIC & Airlines).`,
    warnings: []
  };
}

/**
 * Normalizes and cross-checks a single merged CustCode draft against existing Supabase accounts.
 * When matched to an existing CustCode in DB, merges unique non-identical details and drops 100% identical details!
 */
function finalizeMergedDraft(
  accData,
  index,
  existingByCode,
  existingByName,
  { sourceRows = [], intraFileDuplicatesMerged = 0, intraFileIdenticalDropped = 0 } = {}
) {
  const companyName = cleanCellText(accData.companyName || accData.corporateName);
  let accountCode = cleanAccountCode(accData.accountCode);
  const rowWarnings = [];
  let autoGeneratedCode = false;

  if (!accountCode && companyName) {
    accountCode = generateFallbackAccountCode(companyName, index);
    autoGeneratedCode = true;
  }
  if (autoGeneratedCode) {
    rowWarnings.push('CustCode dibuat otomatis — silakan sesuaikan jika diperlukan.');
  }
  if (!companyName) {
    rowWarnings.push('Nama perusahaan kosong (wajib diisi sebelum simpan).');
  }

  const normalizedNameKey = companyName.toLowerCase().replace(/\s+/g, ' ').trim();
  const matchedByCode = accountCode ? existingByCode.get(accountCode.toLowerCase()) : null;
  const matchedByName = !matchedByCode && normalizedNameKey ? existingByName.get(normalizedNameKey) : null;
  const existingMatch = matchedByCode || matchedByName || null;

  const normalizedPics = normalizePicContacts(accData.picContacts, accData);
  const legacyPics = picContactsToLegacyFields(normalizedPics);

  const baseClean = {
    accountCode,
    companyName,
    corporateName: companyName,
    address: cleanCellText(accData.address),
    creditLimit: parseFlexibleIdrAmount(accData.creditLimit),
    status: normalizeAccountStatus(accData.status),
    picContacts: normalizedPics,
    picName: legacyPics.picName,
    picPhone: legacyPics.picPhone,
    picOfficeEmail: legacyPics.picOfficeEmail,
    picPersonalEmail: legacyPics.picPersonalEmail,
    airlinesCode: cleanCellText(accData.airlinesCode),
    detailLink: cleanCellText(accData.detailLink),
    remarks: cleanCellText(accData.remarks),
    flightFee: serializeFeeProfile(accData.flightFee || DEFAULT_FEE_PROFILE),
    hotelFee: serializeFeeProfile(accData.hotelFee || DEFAULT_FEE_PROFILE)
  };

  let finalPayload = baseClean;
  let statusTag = !companyName ? 'needs_review' : 'new';
  let dbIdenticalDetailsDropped = 0;
  let dbNewUniqueDetails = 0;

  if (existingMatch && companyName) {
    // Merge incoming Excel data INTO existing DB record under the same CustCode,
    // automatically discarding all 100% identical details!
    const dbMerge = mergeCorporateAccountsByCustCode(existingMatch, baseClean, {
      preferIncomingScalar: true
    });
    finalPayload = dbMerge.merged;
    dbIdenticalDetailsDropped = dbMerge.droppedIdenticalDetails;
    dbNewUniqueDetails = dbMerge.newUniqueDetails;
    statusTag = dbMerge.isCompletelyIdentical ? 'identical' : 'duplicate';
  }

  const hasFlightFees = CORPORATE_FEE_KEYS.some((k) => (finalPayload.flightFee[k]?.value || 0) > 0);
  const hasHotelFees = CORPORATE_FEE_KEYS.some((k) => (finalPayload.hotelFee[k]?.value || 0) > 0);

  return {
    ...finalPayload,
    _rowKey: `corp-${accountCode || index}-${index}`,
    _sourceRow: sourceRows[0] || index + 1,
    _sourceRowsCount: Math.max(1, sourceRows.length),
    _intraFileMergedCount: intraFileDuplicatesMerged,
    _identicalDetailsDropped: intraFileIdenticalDropped + dbIdenticalDetailsDropped,
    _newUniqueDetailsVsDb: dbNewUniqueDetails,
    _status: statusTag, // 'new' | 'duplicate' (merge unique into same CustCode) | 'identical' (100% same, auto-discarded) | 'needs_review'
    _existingId: existingMatch?.id || null,
    _existingCode: existingMatch?.accountCode || null,
    _existingCompanyName: existingMatch?.companyName || null,
    _warnings: rowWarnings,
    _hasFlightFees: hasFlightFees,
    _hasHotelFees: hasHotelFees
  };
}

/**
 * Extracts raw normalized fields from a single spreadsheet row using columnMapping.
 */
function extractSingleRowPayload(row, columnMapping, columnLabels) {
  const rec = {
    accountCode: '',
    companyName: '',
    address: '',
    creditLimit: 0,
    status: '',
    picContacts: [],
    picName: '',
    picPhone: '',
    picOfficeEmail: '',
    picPersonalEmail: '',
    picEmailsCombined: '',
    airlinesCode: '',
    airlinesTier: '',
    detailLink: '',
    remarks: '',
    flightFee: {},
    hotelFee: {}
  };

  const rowPicEntries = [];
  const extraRemarks = [];
  let flightFeeSummary = '';
  let hotelFeeSummary = '';

  for (const [colIdxStr, field] of Object.entries(columnMapping)) {
    const colIdx = Number(colIdxStr);
    if (!Number.isInteger(colIdx) || colIdx < 0 || colIdx >= row.length) continue;
    const rawVal = row[colIdx];
    const strVal = cleanCellText(rawVal);
    if (!strVal) continue;

    if (field === 'accountCode') {
      rec.accountCode = cleanAccountCode(strVal);
    } else if (field === 'companyName') {
      rec.companyName = strVal;
    } else if (field === 'picContactCombined' || field === 'picName') {
      const parsedPic = parsePicBookerCell(strVal);
      if (parsedPic.entries.length > 0) {
        rowPicEntries.push(...parsedPic.entries);
      }
      if (parsedPic.names.length > 0) {
        rec.picName = mergeUniqueTokenList(rec.picName, parsedPic.names.join(', '), ', ').merged;
      }
      if (parsedPic.phones.length > 0) {
        rec.picPhone = mergeUniqueTokenList(rec.picPhone, parsedPic.phones.join(', '), ', ').merged;
      }
    } else if (field === 'picPhone') {
      const normPhone = normalizeCorporatePhone(strVal);
      if (normPhone) {
        rec.picPhone = mergeUniqueTokenList(rec.picPhone, normPhone, ', ').merged;
      }
    } else if (field === 'picOfficeEmail' || field === 'picPersonalEmail' || field === 'picEmailsCombined') {
      rec[field] = rec[field] ? `${rec[field]}, ${strVal}` : strVal;
    } else if (field === 'creditLimit') {
      const amt = parseFlexibleIdrAmount(rawVal);
      // Ignore stray single-digit typo artifacts like "1" in credit limit column
      if (amt >= 1000) {
        rec.creditLimit = amt;
      }
    } else if (field === 'airlinesCode') {
      rec.airlinesCode = strVal;
    } else if (field === 'airlinesTier') {
      rec.airlinesTier = strVal;
    } else if (field === 'flightFee.reissuedIntl') {
      const fee = parseFlexibleFeeEntry(rawVal);
      if (fee.value > 0) {
        extraRemarks.push(`Flight Reissued Intl: ${fee.type === 'percent' ? `${fee.value}%` : `Rp ${fee.value.toLocaleString('en-US')}`}`);
      }
    } else if (field === 'flightFee.refundIntl') {
      const fee = parseFlexibleFeeEntry(rawVal);
      if (fee.value > 0) {
        extraRemarks.push(`Flight Refund Intl: ${fee.type === 'percent' ? `${fee.value}%` : `Rp ${fee.value.toLocaleString('en-US')}`}`);
      }
    } else if (field === 'hotelFee.reissuedIntl') {
      const fee = parseFlexibleFeeEntry(rawVal);
      if (fee.value > 0) {
        extraRemarks.push(`Hotel Reschedule Intl: ${fee.type === 'percent' ? `${fee.value}%` : `Rp ${fee.value.toLocaleString('en-US')}`}`);
      } else if (/if\s+able/i.test(strVal)) {
        extraRemarks.push('Hotel Reschedule: If able to reschedule');
      }
    } else if (field === 'hotelFee.refundIntl') {
      const fee = parseFlexibleFeeEntry(rawVal);
      if (fee.value > 0) {
        extraRemarks.push(`Hotel Refund Intl: ${fee.type === 'percent' ? `${fee.value}%` : `Rp ${fee.value.toLocaleString('en-US')}`}`);
      }
    } else if (field.startsWith('flightFee.')) {
      const feeKey = field.split('.')[1];
      if (CORPORATE_FEE_KEYS.includes(feeKey)) {
        const parsedFee = parseFlexibleFeeEntry(rawVal);
        if (parsedFee.value > 0) {
          rec.flightFee[feeKey] = parsedFee;
        }
        // Preserve important text qualifiers (Return, Non-GA, INTL/Int Void/Reval, PPn notes)
        if (/return|non[\s-]?ga|inter|\bintl?\b/i.test(strVal)) {
          const niceLabel = `Flight ${feeKey.charAt(0).toUpperCase() + feeKey.slice(1)}`;
          extraRemarks.push(`${niceLabel}: ${strVal}`);
        }
      }
    } else if (field.startsWith('hotelFee.')) {
      const feeKey = field.split('.')[1];
      if (CORPORATE_FEE_KEYS.includes(feeKey)) {
        const parsedFee = parseFlexibleFeeEntry(rawVal);
        if (parsedFee.value > 0) {
          rec.hotelFee[feeKey] = parsedFee;
        } else if (/if\s+able/i.test(strVal)) {
          extraRemarks.push('Hotel Reschedule: If able to reschedule');
        }
      }
    } else if (field === 'flightFeeSummary') {
      flightFeeSummary = flightFeeSummary ? `${flightFeeSummary}, ${strVal}` : strVal;
    } else if (field === 'hotelFeeSummary') {
      hotelFeeSummary = hotelFeeSummary ? `${hotelFeeSummary}, ${strVal}` : strVal;
    } else if (field === 'remarksExtra') {
      const colLabel = columnLabels[colIdxStr] || `Info ${colIdx + 1}`;
      extraRemarks.push(`${colLabel}: ${strVal}`);
    } else if (field === 'remarks') {
      rec.remarks = mergeUniqueTokenList(rec.remarks, strVal, ' | ').merged;
    } else if (field in rec) {
      rec[field] = rec[field] ? `${rec[field]} | ${strVal}` : strVal;
    }
  }

  // Pair Airlines Corporate Account + Tier/Entry Pricing neatly on the same row
  if (rec.airlinesCode && rec.airlinesTier) {
    rec.airlinesCode = `${rec.airlinesCode} (${rec.airlinesTier})`;
  } else if (!rec.airlinesCode && rec.airlinesTier) {
    rec.airlinesCode = rec.airlinesTier;
  }

  // Rescue phone from combined email cell if present
  if (!rec.picPhone && rec.picEmailsCombined) {
    const phoneMatch = rec.picEmailsCombined.match(/(?:\+?62|0|8)[\d\s-]{8,16}/);
    if (phoneMatch) {
      rec.picPhone = normalizeCorporatePhone(phoneMatch[0]);
    }
  }

  const emails = classifyCorporateEmails(rec.picOfficeEmail, rec.picPersonalEmail, rec.picEmailsCombined);
  rec.picOfficeEmail = emails.picOfficeEmail;
  rec.picPersonalEmail = emails.picPersonalEmail;

  // Build structured per-person PIC contacts paired accurately for this row
  const officeEmailList = rec.picOfficeEmail ? rec.picOfficeEmail.split(/\s*,\s*/).filter(Boolean) : [];
  const personalEmailList = rec.picPersonalEmail ? rec.picPersonalEmail.split(/\s*,\s*/).filter(Boolean) : [];

  if (rowPicEntries.length > 0) {
    const built = rowPicEntries.map((entry, idx) => ({
      name: entry.name || '',
      phone: entry.phone || (idx === 0 ? rec.picPhone : ''),
      officeEmail: '',
      personalEmail: ''
    }));

    const assignEmailToBestEntry = (email, targetField) => {
      if (built.length === 1) {
        built[0][targetField] = built[0][targetField] ? `${built[0][targetField]}, ${email}` : email;
        return;
      }
      const localPart = (email.split('@')[0] || '').toLowerCase();
      let matchedIdx = built.findIndex((entry) => {
        const tokens = (entry.name || '')
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((t) => t.length >= 3 && !['ibu', 'pak', 'bapak', 'mrs', 'mr', 'ms'].includes(t));
        return tokens.some((tok) => localPart.includes(tok));
      });
      if (matchedIdx === -1) {
        matchedIdx = built.findIndex((entry) => !entry[targetField]);
      }
      if (matchedIdx === -1) matchedIdx = 0;
      built[matchedIdx][targetField] = built[matchedIdx][targetField]
        ? `${built[matchedIdx][targetField]}, ${email}`
        : email;
    };

    for (const em of officeEmailList) assignEmailToBestEntry(em, 'officeEmail');
    for (const em of personalEmailList) assignEmailToBestEntry(em, 'personalEmail');

    rec.picContacts = normalizePicContacts(built);
  } else if (rec.picPhone || rec.picOfficeEmail || rec.picPersonalEmail) {
    rec.picContacts = normalizePicContacts([
      {
        name: rec.picName,
        phone: rec.picPhone,
        officeEmail: rec.picOfficeEmail,
        personalEmail: rec.picPersonalEmail
      }
    ]);
  }

  const syncedLegacy = picContactsToLegacyFields(rec.picContacts);
  rec.picName = syncedLegacy.picName;
  rec.picPhone = syncedLegacy.picPhone;
  rec.picOfficeEmail = syncedLegacy.picOfficeEmail;
  rec.picPersonalEmail = syncedLegacy.picPersonalEmail;

  if (flightFeeSummary) {
    rec.flightFee = parseCombinedFeeSummary(flightFeeSummary, rec.flightFee);
  }
  if (hotelFeeSummary) {
    rec.hotelFee = parseCombinedFeeSummary(hotelFeeSummary, rec.hotelFee);
  }

  if (extraRemarks.length > 0) {
    rec.remarks = mergeUniqueTokenList(rec.remarks, extraRemarks.join(' | '), ' | ').merged;
  }

  // Check if this row actually carries meaningful corporate detail (filters out stray "1" or "4" artifact rows)
  const hasMeaningfulDetail = Boolean(
    rec.accountCode ||
      rec.companyName ||
      rec.picName ||
      rec.picPhone ||
      rec.picOfficeEmail ||
      rec.picPersonalEmail ||
      rec.address ||
      rec.airlinesCode ||
      rec.detailLink ||
      rec.remarks ||
      rec.creditLimit >= 1000 ||
      CORPORATE_FEE_KEYS.some((k) => (rec.flightFee[k]?.value || 0) > 0) ||
      CORPORATE_FEE_KEYS.some((k) => (rec.hotelFee[k]?.value || 0) > 0)
  );

  return { rec, hasMeaningfulDetail };
}

/**
 * Applies AI schema result (either `tabular_mapping` or `form_extraction`) to the full Excel grid,
 * merges multi-row continuation blocks AND duplicate CustCodes (discarding 100% identical details),
 * and cross-checks against existing Supabase accounts.
 */
export function buildCorporateAccountDraftsFromAi({
  aiResult,
  allRows = [],
  existingAccounts = [],
  fileName = 'Corporate_Accounts.xlsx',
  sheetName = 'Sheet1'
}) {
  const existingByCode = new Map();
  const existingByName = new Map();
  for (const acc of existingAccounts || []) {
    const code = cleanAccountCode(acc?.accountCode);
    if (code) {
      existingByCode.set(code.toLowerCase(), acc);
    }
    const name = cleanCellText(acc?.companyName || acc?.corporateName).toLowerCase();
    if (name) {
      existingByName.set(name, acc);
    }
  }

  const safeAi = aiResult && typeof aiResult === 'object' ? aiResult : buildHeuristicColumnMapping(allRows);
  const layoutType = safeAi.layoutType === 'form_extraction' ? 'form_extraction' : 'tabular_mapping';

  // Map keyed by normalized CustCode (or fallback company key) so duplicates collapse into ONE record!
  const groupedByCustCode = new Map();
  let totalIntraFileMergedRows = 0;
  let totalIdenticalDetailsDropped = 0;

  const upsertIntoGroup = (entry, sourceRowNum, isDuplicateBlock = false) => {
    const codeKey = cleanAccountCode(entry.accountCode).toLowerCase();
    const nameKey = cleanCellText(entry.companyName).toLowerCase();
    const groupKey = codeKey || (nameKey ? `name:${nameKey}` : `row:${sourceRowNum}`);

    const existingGroup = groupedByCustCode.get(groupKey);
    if (!existingGroup) {
      groupedByCustCode.set(groupKey, {
        data: {
          ...entry,
          flightFee: serializeFeeProfile(entry.flightFee || {}),
          hotelFee: serializeFeeProfile(entry.hotelFee || {})
        },
        sourceRows: [sourceRowNum],
        intraFileDuplicatesMerged: 0,
        intraFileIdenticalDropped: 0
      });
      return;
    }

    // Merge into the SAME CustCode, automatically discarding 100% identical details!
    const mergedRes = mergeCorporateAccountsByCustCode(existingGroup.data, entry, {
      preferIncomingScalar: false // Keep primary row's domestic/base fees & credit limit; append unique continuation/duplicate details
    });
    existingGroup.data = mergedRes.merged;
    existingGroup.sourceRows.push(sourceRowNum);
    if (isDuplicateBlock) {
      existingGroup.intraFileDuplicatesMerged += 1;
      totalIntraFileMergedRows += 1;
    }
    existingGroup.intraFileIdenticalDropped += mergedRes.droppedIdenticalDetails;
    totalIdenticalDetailsDropped += mergedRes.droppedIdenticalDetails;
  };

  if (layoutType === 'form_extraction' && Array.isArray(safeAi.extractedAccounts) && safeAi.extractedAccounts.length > 0) {
    safeAi.extractedAccounts.forEach((item, idx) => {
      if (!item || typeof item !== 'object') return;
      const parsedPic = parsePicBookerCell(item.picName || item.picContactCombined || '');
      const emails = classifyCorporateEmails(
        item.picOfficeEmail || '',
        item.picPersonalEmail || '',
        item.picEmailsCombined || item.email || ''
      );
      const flightFee =
        typeof item.flightFee === 'string'
          ? parseCombinedFeeSummary(item.flightFee)
          : serializeFeeProfile(item.flightFee || {});
      const hotelFee =
        typeof item.hotelFee === 'string'
          ? parseCombinedFeeSummary(item.hotelFee)
          : serializeFeeProfile(item.hotelFee || {});

      const formPics = normalizePicContacts(item.picContacts, {
        picName: parsedPic.names.join(', ') || cleanCellText(item.picName),
        picPhone: mergeUniqueTokenList(normalizeCorporatePhone(item.picPhone), parsedPic.phones.join(', '), ', ').merged,
        picOfficeEmail: emails.picOfficeEmail,
        picPersonalEmail: emails.picPersonalEmail
      });
      const formLegacy = picContactsToLegacyFields(formPics);

      const payload = {
        ...item,
        accountCode: cleanAccountCode(item.accountCode),
        companyName: cleanCellText(item.companyName || item.corporateName),
        picContacts: formPics,
        picName: formLegacy.picName,
        picPhone: formLegacy.picPhone,
        picOfficeEmail: formLegacy.picOfficeEmail,
        picPersonalEmail: formLegacy.picPersonalEmail,
        flightFee,
        hotelFee
      };
      if (payload.companyName || payload.accountCode) {
        const key = (payload.accountCode || '').toLowerCase();
        upsertIntoGroup(payload, idx + 1, Boolean(key && groupedByCustCode.has(key)));
      }
    });
  } else {
    const columnMapping = safeAi.columnMapping || {};
    const columnLabels = safeAi.columnLabels || {};
    const headerSet = new Set(Array.isArray(safeAi.headerRowIndices) ? safeAi.headerRowIndices : []);
    const startIdx = Math.max(0, Number(safeAi.dataStartRowIndex) || 1);

    let currentActiveGroupKey = null;

    for (let r = startIdx; r < allRows.length; r += 1) {
      if (headerSet.has(r)) continue;
      const row = Array.isArray(allRows[r]) ? allRows[r] : [];
      const nonEmptyCells = row.filter((v) => cleanCellText(v) !== '');

      // Completely blank separator row resets active continuation pointer
      if (nonEmptyCells.length === 0) {
        currentActiveGroupKey = null;
        continue;
      }

      const { rec, hasMeaningfulDetail } = extractSingleRowPayload(row, columnMapping, columnLabels);
      if (!hasMeaningfulDetail) continue;

      // Skip TOTAL / SUBTOTAL footer rows
      const lowerCompany = (rec.companyName || '').toLowerCase();
      if (/^(total|grand total|subtotal|jumlah)\b/i.test(lowerCompany)) {
        continue;
      }

      const hasPrimaryIdentity = Boolean(rec.accountCode || rec.companyName);

      if (hasPrimaryIdentity) {
        // Start a new CustCode group OR merge if this exact CustCode already appeared earlier in the file!
        const codeKey = cleanAccountCode(rec.accountCode).toLowerCase();
        const nameKey = cleanCellText(rec.companyName).toLowerCase();
        const groupKey = codeKey || `name:${nameKey}`;
        const alreadyExistsInFile = groupedByCustCode.has(groupKey);
        upsertIntoGroup(rec, r + 1, alreadyExistsInFile);
        currentActiveGroupKey = groupKey;
      } else if (currentActiveGroupKey && groupedByCustCode.has(currentActiveGroupKey)) {
        // Continuation row (empty CustCode & CompanyName) -> merge extra PICs/emails/airlines/fee notes into parent CustCode!
        const parentGroup = groupedByCustCode.get(currentActiveGroupKey);
        const mergedRes = mergeCorporateAccountsByCustCode(parentGroup.data, rec, {
          preferIncomingScalar: false
        });
        parentGroup.data = mergedRes.merged;
        parentGroup.sourceRows.push(r + 1);
        parentGroup.intraFileIdenticalDropped += mergedRes.droppedIdenticalDetails;
        totalIdenticalDetailsDropped += mergedRes.droppedIdenticalDetails;
      }
    }
  }

  // Finalize drafts & run DB CustCode duplicate merging / 100% identical filtering
  const drafts = [];
  let idx = 0;
  for (const group of groupedByCustCode.values()) {
    const finalized = finalizeMergedDraft(group.data, idx, existingByCode, existingByName, {
      sourceRows: group.sourceRows,
      intraFileDuplicatesMerged: group.intraFileDuplicatesMerged,
      intraFileIdenticalDropped: group.intraFileIdenticalDropped
    });
    totalIdenticalDetailsDropped += Math.max(
      0,
      finalized._identicalDetailsDropped - group.intraFileIdenticalDropped
    );
    drafts.push(finalized);
    idx += 1;
  }

  const counts = {
    total: drafts.length,
    newCount: drafts.filter((d) => d._status === 'new').length,
    duplicateCount: drafts.filter((d) => d._status === 'duplicate').length,
    identicalCount: drafts.filter((d) => d._status === 'identical').length,
    reviewCount: drafts.filter((d) => d._status === 'needs_review').length,
    intraFileMergedCount: totalIntraFileMergedRows,
    identicalDetailsDropped: totalIdenticalDetailsDropped
  };

  return {
    drafts,
    meta: {
      fileName,
      sheetName,
      layoutType,
      detectionSummary:
        safeAi.detectionSummary ||
        `Berhasil mengekstrak ${drafts.length} CustCode unik dari sheet "${sheetName}".`,
      mappedColumnsCount: Object.keys(safeAi.columnMapping || {}).length,
      warnings: Array.isArray(safeAi.warnings) ? safeAi.warnings : [],
      counts
    }
  };
}

/**
 * Extracts all sheets and normalized cell strings from an Excel (.xlsx) or CSV File in the browser.
 * Preserves Excel percentage formatting (e.g. 0.025 with "0.0%" -> "2.5%") and hyperlinks!
 */
export async function readCorporateSpreadsheetFile(file) {
  const fileName = file?.name || 'Corporate_Accounts.xlsx';
  const lowerName = fileName.toLowerCase();

  // CSV path via PapaParse (preserve empty separator rows so continuation boundaries work accurately!)
  if (lowerName.endsWith('.csv') || file.type === 'text/csv') {
    const Papa = (await import('papaparse')).default;
    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: false,
      skipEmptyLines: false
    });
    const rows = (parsed.data || []).map((row) =>
      Array.isArray(row) ? row.map((cell) => cleanCellText(cell)) : []
    );
    return {
      fileName,
      sheets: [{ sheetName: 'CSV', totalRows: rows.length, rows }]
    };
  }

  // Excel (.xlsx) path via ExcelJS (dynamically imported so main bundle stays light)
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const sheets = [];
  workbook.eachSheet((worksheet) => {
    const rows = [];
    const maxCol = Math.min(worksheet.columnCount || 40, 60);
    const totalWorksheetRows = worksheet.rowCount || 0;

    for (let r = 1; r <= totalWorksheetRows; r += 1) {
      const row = worksheet.getRow(r);
      const rowValues = [];
      let hasAnyValue = false;

      for (let c = 1; c <= maxCol; c += 1) {
        const cell = row.getCell(c);
        const val = extractExcelCellDisplayValue(cell);
        if (val !== '') hasAnyValue = true;
        rowValues.push(val);
      }

      if (hasAnyValue) {
        while (rowValues.length > 0 && rowValues[rowValues.length - 1] === '') {
          rowValues.pop();
        }
        rows.push(rowValues);
      } else if (rows.length > 0 && rows[rows.length - 1].length > 0) {
        // Keep a single empty separator row to mark continuation block boundaries
        rows.push([]);
      }
    }

    if (rows.some((r) => r.length > 0)) {
      sheets.push({
        sheetName: worksheet.name || `Sheet${sheets.length + 1}`,
        totalRows: rows.filter((r) => r.length > 0).length,
        rows
      });
    }
  });

  if (sheets.length === 0) {
    throw new Error('Tidak ditemukan data pada file Excel yang diunggah.');
  }

  return { fileName, sheets };
}

function extractExcelCellDisplayValue(cell) {
  if (!cell || cell.value === null || cell.value === undefined) return '';
  const raw = cell.value;

  if (typeof raw === 'object' && raw !== null) {
    if (raw.hyperlink) {
      const text = typeof raw.text === 'string' ? raw.text : raw.hyperlink;
      if (raw.hyperlink.startsWith('http')) return raw.hyperlink;
      return cleanCellText(text).replace(/^mailto:/i, '');
    }
    if (Array.isArray(raw.richText)) {
      return cleanCellText(raw.richText.map((part) => part.text || '').join(''));
    }
    if ('result' in raw) {
      if (raw.result === null || raw.result === undefined) return '';
      return formatScalarExcelValue(raw.result, cell.numFmt);
    }
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
      return raw.toISOString().slice(0, 10);
    }
    if (raw.text) return cleanCellText(raw.text);
    return '';
  }

  return formatScalarExcelValue(raw, cell.numFmt);
}

function formatScalarExcelValue(val, numFmt = '') {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return '';
    if (typeof numFmt === 'string' && numFmt.includes('%') && Math.abs(val) <= 2) {
      const pct = Math.round(val * 10000) / 100;
      return `${pct}%`;
    }
    return String(val);
  }
  if (typeof val === 'boolean') return val ? 'Active' : 'Inactive';
  return cleanCellText(val);
}

/**
 * Generates and downloads a clean starter Excel template (.xlsx) for Corporate Accounts.
 */
export async function downloadCorporateAccountTemplate() {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Corporate Accounts');

  sheet.columns = [
    { header: 'CustCode', key: 'accountCode', width: 16 },
    { header: 'Nama Corporate', key: 'companyName', width: 32 },
    { header: 'PIC Bookers', key: 'picBookers', width: 30 },
    { header: 'Contact Email Address', key: 'picOfficeEmail', width: 28 },
    { header: 'Contact Email Address Alternatif', key: 'picPersonalEmail', width: 28 },
    { header: 'Credit Limit', key: 'creditLimit', width: 20 },
    { header: 'Contact Address', key: 'address', width: 38 },
    { header: 'Flight Domestic', key: 'fDom', width: 22 },
    { header: 'Flight International', key: 'fIntl', width: 20 },
    { header: 'Flight Reissued', key: 'fReissue', width: 18 },
    { header: 'Flight Refund', key: 'fRefund', width: 18 },
    { header: 'Flight Void', key: 'fVoid', width: 16 },
    { header: 'Flight Revalidate', key: 'fReval', width: 18 },
    { header: 'Hotel Domestic', key: 'hDom', width: 20 },
    { header: 'Hotel International', key: 'hIntl', width: 20 },
    { header: 'Hotel Reschedule', key: 'hResched', width: 20 },
    { header: 'Hotel Refund', key: 'hRefund', width: 18 },
    { header: 'Airlines Corporate Account', key: 'airlinesCode', width: 22 },
    { header: 'Tier / Entry Pricing', key: 'airlinesTier', width: 24 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1329' } };

  sheet.addRow({
    accountCode: 'CBINDA',
    companyName: 'PT BINA ADI DAYA',
    picBookers: 'IBU MEI MEI (089651346555)',
    picOfficeEmail: 'cherrie@binaadidaya.com',
    picPersonalEmail: 'meimei2082@gmail.com',
    creditLimit: 'Rp 50,000,000',
    address: 'Graha Penta Prima, Jl. Boulevard Barat Raya, Kelapa Gading, Jakarta Utara',
    fDom: 'Rp 15,000/One Way',
    fIntl: '3%',
    fReissue: 'Rp 100,000',
    fRefund: 'Rp 100,000',
    fVoid: 'Free',
    fReval: 'Free',
    hDom: 'Rp 50,000/R/N',
    hIntl: 'Rp 100,000/R/N',
    hResched: 'Rp 50,000/R/N',
    hRefund: 'TBA',
    airlinesCode: 'GA',
    airlinesTier: 'FXP/R,U*CORP',
    remarks: 'TOP 14 Hari'
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'TravelOps_Corporate_Accounts_Template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
