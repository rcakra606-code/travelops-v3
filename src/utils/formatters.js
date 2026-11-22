/**
 * Unified Enterprise BI Formatters & Restrained Chart Palette
 * Single source of truth for IDR currency, compact financial notation,
 * percentages, period-over-period deltas, dates, and CSV serialization.
 */

export const BI_CHART_COLORS = {
  primary: '#0284c7',
  primarySoft: '#38bdf8',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#e11d48',
  slate: '#64748b',
  teal: '#0d9488',
  indigo: '#4f46e5',
  series: [
    '#0284c7', // Primary Sky
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#64748b', // Neutral Slate
    '#0d9488', // Teal
    '#e11d48', // Rose
    '#4f46e5'  // Indigo
  ]
};

const toSafeNumber = (val) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = Number(val);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Standard IDR currency formatting with 3-digit comma grouping:
 * e.g. 50000000 -> "Rp 50,000,000", -1250000 -> "-Rp 1,250,000"
 */
export const formatIdr = (value, { fallback = 'Rp 0', signed = false } = {}) => {
  if (value === null || value === undefined || value === '') return fallback;
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  const absFormatted = Math.abs(rounded).toLocaleString('en-US');
  if (rounded < 0) return `-Rp ${absFormatted}`;
  if (signed && rounded > 0) return `+Rp ${absFormatted}`;
  return `Rp ${absFormatted}`;
};

/**
 * Compact IDR formatting for KPI cards and chart axes:
 * e.g. 1_250_000_000 -> "Rp 1.25B", 45_200_000 -> "Rp 45.2M", 850_000 -> "Rp 850K"
 */
export const formatCompactIdr = (value) => {
  const num = toSafeNumber(value);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);

  if (abs >= 1_000_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (abs >= 1_000_000_000) {
    return `${sign}Rp ${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    return `${sign}Rp ${millions >= 100 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}Rp ${Math.round(abs / 1_000)}K`;
  }
  return `${sign}Rp ${Math.round(abs).toLocaleString('en-US')}`;
};

/**
 * Compact numeric axis tick without "Rp" prefix for cleaner Y-axes
 */
export const formatAxisCompact = (value) => {
  const num = toSafeNumber(value);
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K`;
  return `${sign}${Math.round(abs)}`;
};

/**
 * Standard comma-grouped integer/decimal formatting
 */
export const formatNumber = (value, decimals = 0) => {
  const num = toSafeNumber(value);
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Percentage formatting (expects 0..100 scale, e.g. 14.25 -> "14.3%")
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(decimals)}%`;
};

/**
 * Period-over-period percentage delta helper.
 * Handles zero previous baseline cleanly without producing Infinity or NaN.
 */
export const computeDelta = (currentVal, previousVal, { isPoints = false } = {}) => {
  const curr = toSafeNumber(currentVal);
  const prev = toSafeNumber(previousVal);

  if (isPoints) {
    const diff = curr - prev;
    if (Math.abs(diff) < 0.05) {
      return { value: 0, label: '0.0 pp', direction: 'flat' };
    }
    return {
      value: diff,
      label: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pp`,
      direction: diff > 0 ? 'up' : 'down'
    };
  }

  if (prev === 0 && curr === 0) {
    return { value: 0, label: '0.0%', direction: 'flat' };
  }
  if (prev === 0 && curr > 0) {
    return { value: null, label: 'Baru', direction: 'new' };
  }
  if (prev === 0 && curr < 0) {
    return { value: null, label: 'Turun', direction: 'down' };
  }

  const pct = ((curr - prev) / Math.abs(prev)) * 100;
  if (!Number.isFinite(pct) || Math.abs(pct) < 0.05) {
    return { value: 0, label: '0.0%', direction: 'flat' };
  }
  const capped = Math.max(-999.9, Math.min(999.9, pct));
  return {
    value: pct,
    label: `${capped > 0 ? '+' : ''}${capped.toFixed(1)}%`,
    direction: pct > 0 ? 'up' : 'down'
  };
};

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Format YYYY-MM into readable Indonesian short month label (e.g. "2026-03" -> "Mar 2026")
 */
export const formatMonthLabel = (ymStr) => {
  if (!ymStr || typeof ymStr !== 'string') return '-';
  const match = ymStr.trim().match(/^(\d{4})-(\d{2})/);
  if (!match) return ymStr;
  const year = match[1];
  const monthIdx = parseInt(match[2], 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return ymStr;
  return `${SHORT_MONTHS[monthIdx]} ${year}`;
};

/**
 * Format YYYY-MM-DD into short readable date (e.g. "2026-03-14" -> "14 Mar 2026")
 */
export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  const match = String(dateStr).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    if (monthIdx >= 0 && monthIdx <= 11) {
      return `${day} ${SHORT_MONTHS[monthIdx]} ${year}`;
    }
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * RFC-4180 CSV cell escaping with formula-injection neutralization
 */
export const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};
