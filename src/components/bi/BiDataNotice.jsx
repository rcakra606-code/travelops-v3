import { Info, AlertTriangle, Database } from 'lucide-react';

/**
 * Quiet Data Transparency / Boundary Notice
 * Used to explicitly label metrics unavailable in the current database schema
 * (e.g. Operating Expenses, Net Profit, Vendor AP, CAC) so numbers are never fabricated.
 */
const BiDataNotice = ({ tone = 'info', title, children }) => {
  const styles = {
    info: {
      border: 'var(--border)',
      bg: 'var(--bg-surface)',
      iconColor: 'var(--primary)',
      icon: <Info size={15} aria-hidden="true" />
    },
    limitation: {
      border: 'var(--border)',
      bg: 'var(--bg-surface)',
      iconColor: 'var(--text-subtle)',
      icon: <Database size={15} aria-hidden="true" />
    },
    warning: {
      border: 'rgba(245, 158, 11, 0.35)',
      bg: 'rgba(245, 158, 11, 0.07)',
      iconColor: 'var(--warning)',
      icon: <AlertTriangle size={15} aria-hidden="true" />
    }
  };

  const s = styles[tone] || styles.info;

  return (
    <aside
      role="note"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
        padding: '0.72rem 0.9rem',
        borderRadius: '8px',
        background: s.bg,
        border: `1px solid ${s.border}`,
        fontSize: '0.77rem',
        lineHeight: 1.5,
        color: 'var(--text-muted)'
      }}
    >
      <span style={{ color: s.iconColor, marginTop: '2px', flexShrink: 0 }}>
        {s.icon}
      </span>
      <div style={{ minWidth: 0 }}>
        {title && (
          <strong style={{ color: 'var(--text-main)', fontWeight: 700, marginRight: '0.35rem' }}>
            {title}:
          </strong>
        )}
        <span>{children}</span>
      </div>
    </aside>
  );
};

export default BiDataNotice;
