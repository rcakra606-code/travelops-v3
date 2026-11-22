import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';

/**
 * Restrained Enterprise KPI Indicator Card
 * - Tabular numerals for instant scanning
 * - Explicit comparison period label & delta badge
 * - Supports invertPolarity (e.g. lower Cancellation Rate or Receivables = positive)
 * - Keyboard-accessible drill-down when onClick is provided
 */
const BiKpiCard = ({
  label,
  value,
  subValue,
  delta,
  comparisonLabel,
  invertPolarity = false,
  tone = 'neutral', // 'neutral' | 'primary' | 'success' | 'warning' | 'danger'
  icon,
  drilldownLabel,
  onClick
}) => {
  const accentColorMap = {
    neutral: 'var(--border-hover)',
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)'
  };

  const getDeltaStyle = () => {
    if (!delta || delta.direction === 'flat' || delta.direction === 'na') {
      return {
        color: 'var(--text-muted)',
        bg: 'var(--bg-surface)',
        icon: <Minus size={12} aria-hidden="true" />
      };
    }
    if (delta.direction === 'new') {
      return {
        color: 'var(--primary)',
        bg: 'var(--primary-soft)',
        icon: <ArrowUpRight size={12} aria-hidden="true" />
      };
    }
    const isUp = delta.direction === 'up';
    const isGood = invertPolarity ? !isUp : isUp;
    return {
      color: isGood ? 'var(--success)' : 'var(--danger)',
      bg: isGood ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
      icon: isUp ? <ArrowUpRight size={12} aria-hidden="true" /> : <ArrowDownRight size={12} aria-hidden="true" />
    };
  };

  const deltaStyle = getDeltaStyle();
  const isInteractive = typeof onClick === 'function';

  const cardStyle = {
    width: '100%',
    textAlign: 'left',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderTop: `2px solid ${accentColorMap[tone] || accentColorMap.neutral}`,
    borderRadius: '10px',
    padding: '0.95rem 1.05rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.55rem',
    cursor: isInteractive ? 'pointer' : 'default',
    transition: 'border-color 0.15s ease, background-color 0.15s ease'
  };

  const innerContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)'
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            aria-hidden="true"
            style={{
              color: 'var(--text-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            {icon}
          </span>
        )}
      </div>

      <div
        className="tabular-nums"
        style={{
          fontSize: '1.42rem',
          fontWeight: 800,
          lineHeight: 1.18,
          letterSpacing: '-0.025em',
          color: 'var(--text-main)',
          fontVariantNumeric: 'tabular-nums'
        }}
      >
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', minWidth: 0 }}>
          {delta && (
            <span
              className="tabular-nums"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.15rem',
                padding: '0.12rem 0.42rem',
                borderRadius: '5px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: deltaStyle.color,
                background: deltaStyle.bg,
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {deltaStyle.icon}
              {delta.label}
            </span>
          )}
          {comparisonLabel && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              {comparisonLabel}
            </span>
          )}
          {!comparisonLabel && subValue && (
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              {subValue}
            </span>
          )}
        </div>

        {isInteractive && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.1rem',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--primary)',
              flexShrink: 0
            }}
          >
            {drilldownLabel || 'Detail'}
            <ChevronRight size={13} aria-hidden="true" />
          </span>
        )}
      </div>

      {comparisonLabel && subValue && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            paddingTop: '0.35rem',
            borderTop: '1px solid var(--border-subtle)'
          }}
        >
          {subValue}
        </div>
      )}
    </>
  );

  if (isInteractive) {
    return (
      <button
        type="button"
        className="bi-kpi-card bi-kpi-card-interactive"
        style={cardStyle}
        onClick={onClick}
        aria-label={`${label}: ${value}. ${drilldownLabel || 'Lihat detail'}`}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div className="bi-kpi-card" style={cardStyle}>
      {innerContent}
    </div>
  );
};

export default BiKpiCard;
