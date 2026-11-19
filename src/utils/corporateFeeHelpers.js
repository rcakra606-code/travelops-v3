/**
 * Corporate Financial & Service Fee Helpers
 * - 3-digit comma formatting (e.g. 50,000,000) for all financial inputs & displays
 * - Backward-compatible Nominal (Rp) & Percentage (%) Service Fee profiles
 */

export const CORPORATE_FEE_KEYS = [
  'domestic',
  'international',
  'reissued',
  'refund',
  'void',
  'revalidate'
];

export const CORPORATE_FEE_LABELS = {
  domestic: 'Domestic',
  international: 'International',
  reissued: 'Reissued',
  refund: 'Refund',
  void: 'Void',
  revalidate: 'Revalidate'
};

/**
 * Parse comma-formatted currency string or number into non-negative integer
 */
export const parseCommaNumber = (val) => {
  if (typeof val === 'number') {
    return Number.isFinite(val) && val > 0 ? Math.round(val) : 0;
  }
  const digits = String(val ?? '').replace(/[^\d]/g, '');
  if (!digits) return 0;
  const num = Number(digits);
  return Number.isFinite(num) && num >= 0 ? Math.round(num) : 0;
};

/**
 * Format numeric amount with 3-digit comma grouping (empty string when empty/zero for inputs)
 */
export const formatCommaNumber = (val, { allowZero = false } = {}) => {
  if (val === '' || val === null || val === undefined) return '';
  const num = parseCommaNumber(val);
  if (num === 0 && !allowZero) return '';
  return num.toLocaleString('en-US');
};

/**
 * Format currency display consistently with 3-digit comma grouping (e.g. Rp 50,000,000)
 */
export const formatCorporateIdr = (val) => {
  const num = Number(String(val ?? 0).replace(/,/g, ''));
  const safe = Number.isFinite(num) ? Math.round(num) : 0;
  const sign = safe < 0 ? '-' : '';
  return `${sign}Rp ${Math.abs(safe).toLocaleString('en-US')}`;
};

/**
 * Sanitize percentage string input while typing (allows digits & single decimal point, max 100)
 */
export const sanitizePercentInput = (raw) => {
  let str = String(raw ?? '').replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const parts = str.split('.');
  if (parts.length > 2) {
    str = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  if (parts[1] && parts[1].length > 2) {
    str = `${parts[0]}.${parts[1].slice(0, 2)}`;
  }
  const numeric = parseFloat(str);
  if (Number.isFinite(numeric) && numeric > 100) {
    return '100';
  }
  return str;
};

/**
 * Parse any legacy or structured service fee entry into { type: 'nominal' | 'percent', value: number | string }
 */
export const parseFeeEntry = (raw) => {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const type = raw.type === 'percent' ? 'percent' : 'nominal';
    if (type === 'percent') {
      const rawStr = raw.rawInput !== undefined ? String(raw.rawInput) : String(raw.value ?? '');
      const num = parseFloat(rawStr.replace(/,/g, '.'));
      return {
        type: 'percent',
        value: Number.isFinite(num) && num >= 0 ? Math.min(100, num) : 0,
        rawInput: raw.rawInput !== undefined ? raw.rawInput : (Number.isFinite(num) && num > 0 ? String(num) : '')
      };
    }
    const num = parseCommaNumber(raw.value);
    return { type: 'nominal', value: num };
  }

  if (typeof raw === 'string' && raw.trim().endsWith('%')) {
    const num = parseFloat(raw.replace('%', '').replace(/,/g, '.').trim());
    const safe = Number.isFinite(num) && num >= 0 ? Math.min(100, num) : 0;
    return { type: 'percent', value: safe, rawInput: safe > 0 ? String(safe) : '' };
  }

  return {
    type: 'nominal',
    value: parseCommaNumber(raw)
  };
};

/**
 * Normalize an entire flightFee / hotelFee object for AccountFormModal editing state
 */
export const normalizeFeeProfile = (rawProfile = {}) => {
  const safe = rawProfile && typeof rawProfile === 'object' ? rawProfile : {};
  const result = {};
  CORPORATE_FEE_KEYS.forEach((key) => {
    result[key] = parseFeeEntry(safe[key]);
  });
  return result;
};

/**
 * Serialize fee profile into clean JSONB payload for Supabase storage
 */
export const serializeFeeProfile = (profile = {}) => {
  const safe = profile && typeof profile === 'object' ? profile : {};
  const result = {};
  CORPORATE_FEE_KEYS.forEach((key) => {
    const parsed = parseFeeEntry(safe[key]);
    if (parsed.type === 'percent') {
      const num = parseFloat(String(parsed.rawInput ?? parsed.value).replace(/,/g, '.'));
      const clamped = Number.isFinite(num) && num >= 0 ? Math.min(100, Math.round(num * 100) / 100) : 0;
      result[key] = { type: 'percent', value: clamped };
    } else {
      result[key] = { type: 'nominal', value: parseCommaNumber(parsed.value) };
    }
  });
  return result;
};

/**
 * Format a single service fee entry for human-readable display (Drawer / Tables)
 */
export const formatFeeEntryDisplay = (raw) => {
  const entry = parseFeeEntry(raw);
  if (entry.type === 'percent') {
    const num = Number(entry.value) || 0;
    const formatted = Number.isInteger(num) ? String(num) : String(Math.round(num * 100) / 100);
    return `${formatted}%`;
  }
  return formatCorporateIdr(entry.value);
};
