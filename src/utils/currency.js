/**
 * Parses a formatted currency string (e.g., "1,000,000") into a number.
 * @param {string} value
 * @returns {number}
 */
export const parseCurrency = (value) => {
  if (!value) return 0;
  const stringValue = String(value);
  const parsed = parseInt(stringValue.replace(/,/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Formats a number into a comma-separated string (e.g., 1000000 -> "1,000,000").
 * @param {number|string} value
 * @returns {string}
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '';
  const parsed = parseCurrency(value);
  if (parsed === 0 && (value === '0' || value === 0)) return '0';
  if (parsed === 0) return '';
  return parsed.toLocaleString('en-US');
};
