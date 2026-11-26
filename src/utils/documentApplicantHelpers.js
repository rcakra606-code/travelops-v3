/**
 * Multi-Applicant Helpers for Visa & Document Records (`travelops_documents`).
 *
 * Canonical per-applicant shape stored in `travelops_documents.applicants` (JSONB):
 *   {
 *     fullName: string,
 *     passportNumber: string,
 *     passportExpiredDate: string, // YYYY-MM-DD or ''
 *     dateOfBirth: string,         // YYYY-MM-DD or ''
 *     category: 'Adult' | 'Child' | 'Infant',
 *     note: string
 *   }
 *
 * Automatically stays bidirectionally synced with legacy `guest_name` (comma-separated)
 * so search, dashboard, calendar, reminders, WhatsApp, and CSV exports stay 100% compatible.
 */

const VALID_CATEGORIES = new Set(['Adult', 'Child', 'Infant']);

function cleanText(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeIsoDate(val) {
  const str = cleanText(val);
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

function normalizeCategory(val) {
  const raw = cleanText(val).toLowerCase();
  if (raw === 'child' || raw === 'anak' || raw === 'chd') return 'Child';
  if (raw === 'infant' || raw === 'bayi' || raw === 'inf') return 'Infant';
  if (VALID_CATEGORIES.has(cleanText(val))) return cleanText(val);
  return 'Adult';
}

export function createEmptyApplicant() {
  return {
    fullName: '',
    passportNumber: '',
    passportExpiredDate: '',
    dateOfBirth: '',
    category: 'Adult',
    note: ''
  };
}

export function sanitizeApplicant(raw) {
  if (!raw) return createEmptyApplicant();
  if (typeof raw === 'string') {
    return {
      ...createEmptyApplicant(),
      fullName: cleanText(raw)
    };
  }
  const title = cleanText(raw.title);
  const baseName = cleanText(raw.fullName ?? raw.name ?? raw.guestName ?? '');
  let fullName = baseName;
  if (title && baseName && !baseName.toLowerCase().startsWith(title.toLowerCase())) {
    fullName = `${title} ${baseName}`.trim();
  } else if (title && !baseName) {
    fullName = title;
  }

  return {
    fullName,
    passportNumber: cleanText(raw.passportNumber ?? raw.passport_number ?? '').toUpperCase(),
    passportExpiredDate: normalizeIsoDate(raw.passportExpiredDate ?? raw.passport_expired_date ?? ''),
    dateOfBirth: normalizeIsoDate(raw.dateOfBirth ?? raw.date_of_birth ?? ''),
    category: normalizeCategory(raw.category),
    note: cleanText(raw.note)
  };
}

export function isApplicantEmpty(app) {
  const s = sanitizeApplicant(app);
  return !s.fullName && !s.passportNumber;
}

/**
 * Splits a legacy comma/semicolon/newline-separated guestName string into individual names.
 */
export function splitLegacyGuestNames(rawGuestName = '') {
  const raw = String(rawGuestName || '').trim();
  if (!raw) return [];
  return raw
    .split(/\s*[,;\n]+\s*/)
    .map((s) => cleanText(s))
    .filter(Boolean);
}

/**
 * Normalizes applicants array with transparent fallback to legacy `guestName` string.
 * Deduplicates exact identical applicant rows while preserving order.
 */
export function normalizeDocumentApplicants(applicants, legacyGuestName = '') {
  const rawList = Array.isArray(applicants)
    ? applicants.map(sanitizeApplicant).filter((a) => !isApplicantEmpty(a))
    : [];

  const sourceList =
    rawList.length > 0
      ? rawList
      : splitLegacyGuestNames(legacyGuestName).map((name) => ({
          ...createEmptyApplicant(),
          fullName: name
        }));

  const seen = new Set();
  const result = [];
  for (const app of sourceList) {
    const key = `${app.fullName.toLowerCase()}|${app.passportNumber.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(app);
  }
  return result;
}

/**
 * Converts structured applicants array into the comma-separated legacy `guestName` string.
 */
export function applicantsToGuestName(applicants = []) {
  const normalized = normalizeDocumentApplicants(applicants);
  return normalized
    .map((a) => a.fullName)
    .filter(Boolean)
    .join(', ');
}

/**
 * Builds UI-ready display summary for table cells, mobile cards, and drawers.
 */
export function getApplicantDisplaySummary(doc = {}) {
  const applicants = normalizeDocumentApplicants(doc.applicants, doc.guestName || doc.guest_name || '');
  const count = applicants.length;
  const primaryName = applicants[0]?.fullName || cleanText(doc.guestName || doc.guest_name || '') || '-';
  const extraCount = Math.max(0, count - 1);
  const allNamesText = applicants.map((a) => a.fullName).filter(Boolean).join(', ') || primaryName;

  return {
    applicants,
    count,
    primaryName,
    extraCount,
    allNamesText
  };
}

/**
 * Returns searchable lowercase string covering all applicant names, passports & notes.
 */
export function getDocumentApplicantSearchText(doc = {}) {
  const applicants = normalizeDocumentApplicants(doc.applicants, doc.guestName || doc.guest_name || '');
  return applicants
    .map((a) => `${a.fullName} ${a.passportNumber} ${a.note}`)
    .join(' ')
    .toLowerCase();
}
