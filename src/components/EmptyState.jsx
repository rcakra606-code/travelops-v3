import { Inbox } from 'lucide-react';

/**
 * Unified Empty State component for tables, filtered lists, and panels.
 */
const EmptyState = ({
  icon = null,
  title = 'Belum ada data',
  description = 'Coba ubah filter pencarian atau tambahkan data baru.',
  actionLabel = '',
  onAction = null,
  compact = false
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '2rem 1rem' : '3rem 1.5rem',
        color: 'var(--text-muted)'
      }}
    >
      <div
        style={{
          width: compact ? '44px' : '52px',
          height: compact ? '44px' : '52px',
          borderRadius: '14px',
          background: 'var(--primary-soft)',
          border: '1px solid var(--border)',
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '0.85rem'
        }}
      >
        {icon || <Inbox size={compact ? 20 : 24} />}
      </div>
      <p
        style={{
          margin: 0,
          fontWeight: '700',
          fontSize: compact ? '0.9rem' : '0.98rem',
          color: 'var(--text-main)'
        }}
      >
        {title}
      </p>
      {description && (
        <p
          style={{
            margin: '0.3rem 0 0 0',
            fontSize: '0.81rem',
            color: 'var(--text-subtle)',
            maxWidth: '380px',
            lineHeight: 1.5
          }}
        >
          {description}
        </p>
      )}
      {actionLabel && typeof onAction === 'function' && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-secondary"
          style={{
            marginTop: '0.95rem',
            padding: '0.45rem 0.95rem',
            fontSize: '0.8rem'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
