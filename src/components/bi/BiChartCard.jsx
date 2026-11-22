import { BiEmptyState } from './BiStates';

/**
 * Consistent Container for Charts & Analytical Tables
 * Enforces restrained border hierarchy, clear units/timeframes, and clean empty states.
 */
const BiChartCard = ({
  title,
  subtitle,
  badge,
  action,
  isEmpty = false,
  emptyTitle = 'Belum ada data pada periode ini',
  emptyDescription = 'Ubah rentang waktu atau filter di atas untuk melihat visualisasi data.',
  footer,
  children,
  minHeight
}) => {
  return (
    <section
      className="bi-chart-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '1.05rem 1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3
              style={{
                margin: 0,
                fontSize: '0.92rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p
              style={{
                margin: '0.2rem 0 0 0',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>

      <div style={{ width: '100%', minWidth: 0, minHeight: minHeight || undefined }}>
        {isEmpty ? (
          <BiEmptyState title={emptyTitle} description={emptyDescription} compact />
        ) : (
          children
        )}
      </div>

      {footer && (
        <div
          style={{
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.72rem',
            color: 'var(--text-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}
        >
          {footer}
        </div>
      )}
    </section>
  );
};

export default BiChartCard;
