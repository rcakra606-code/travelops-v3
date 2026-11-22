import { formatIdr, formatCompactIdr, formatNumber, formatPercent } from '../../utils/formatters';

/**
 * Shared Recharts Tooltip Component
 * Uses CSS theme variables for consistent Dark/Light contrast and tabular numerals.
 *
 * valueFormat: 'currency' | 'compactCurrency' | 'percent' | 'days' | 'count' | (val, name, item) => string
 */
const BiTooltip = ({
  active,
  payload,
  label,
  valueFormat = 'currency',
  labelFormatter
}) => {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  const formatVal = (val, name, item) => {
    if (typeof valueFormat === 'function') {
      return valueFormat(val, name, item);
    }
    if (valueFormat === 'currency') return formatIdr(val);
    if (valueFormat === 'compactCurrency') return formatCompactIdr(val);
    if (valueFormat === 'percent') return formatPercent(val, 1);
    if (valueFormat === 'days') return `${formatNumber(val, 1)} hari`;
    return formatNumber(val, 0);
  };

  const resolvedLabel = typeof labelFormatter === 'function' ? labelFormatter(label, payload) : label;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-hover)',
        borderRadius: '8px',
        padding: '0.6rem 0.78rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.24)',
        minWidth: '170px',
        fontSize: '0.76rem'
      }}
    >
      {resolvedLabel && (
        <div
          style={{
            fontWeight: 700,
            color: 'var(--text-main)',
            paddingBottom: '0.35rem',
            marginBottom: '0.38rem',
            borderBottom: '1px solid var(--border)'
          }}
        >
          {resolvedLabel}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.28rem' }}>
        {payload.map((entry, idx) => (
          <div
            key={`${entry.dataKey || entry.name || idx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.9rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
              <span
                aria-hidden="true"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '2px',
                  background: entry.color || entry.fill || 'var(--primary)',
                  flexShrink: 0
                }}
              />
              <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {entry.name}
              </span>
            </div>
            <strong
              className="tabular-nums"
              style={{
                color: 'var(--text-main)',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {formatVal(entry.value, entry.name, entry)}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BiTooltip;
