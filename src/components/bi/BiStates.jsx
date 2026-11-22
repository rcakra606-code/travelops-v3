import { BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

export const BiEmptyState = ({
  title = 'Belum ada data tersedia',
  description = 'Data akan tampil otomatis setelah transaksi tercatat pada periode yang dipilih.',
  action,
  compact = false
}) => (
  <div
    role="status"
    style={{
      padding: compact ? '2rem 1rem' : '3rem 1.5rem',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.45rem',
      color: 'var(--text-muted)'
    }}
  >
    <div
      aria-hidden="true"
      style={{
        width: '38px',
        height: '38px',
        borderRadius: '9px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-subtle)',
        marginBottom: '0.2rem'
      }}
    >
      <BarChart3 size={18} />
    </div>
    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
      {title}
    </p>
    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-muted)', maxWidth: '380px', lineHeight: 1.45 }}>
      {description}
    </p>
    {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
  </div>
);

export const BiErrorState = ({
  title = 'Gagal memuat analitik',
  message = 'Terjadi kesalahan saat memproses data.',
  onRetry
}) => (
  <div
    role="alert"
    style={{
      padding: '1.5rem',
      borderRadius: '10px',
      background: 'rgba(244, 63, 94, 0.08)',
      border: '1px solid rgba(244, 63, 94, 0.3)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap'
    }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
      <AlertCircle size={18} color="var(--danger)" style={{ marginTop: '2px', flexShrink: 0 }} aria-hidden="true" />
      <div>
        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{message}</div>
      </div>
    </div>
    {typeof onRetry === 'function' && (
      <button
        type="button"
        onClick={onRetry}
        className="btn btn-secondary"
        style={{ fontSize: '0.76rem', padding: '0.4rem 0.75rem', borderRadius: '7px' }}
      >
        <RefreshCw size={13} aria-hidden="true" /> Coba Lagi
      </button>
    )}
  </div>
);

export const BiLoadingGrid = ({ kpiCount = 4 }) => (
  <div aria-busy="true" aria-label="Memuat data Business Intelligence..." style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.85rem'
      }}
    >
      {Array.from({ length: kpiCount }).map((_, idx) => (
        <div
          key={idx}
          className="shimmer-skeleton"
          style={{ height: '108px', borderRadius: '10px', border: '1px solid var(--border)' }}
        />
      ))}
    </div>
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1rem'
      }}
    >
      <div className="shimmer-skeleton" style={{ height: '300px', borderRadius: '10px', border: '1px solid var(--border)' }} />
      <div className="shimmer-skeleton" style={{ height: '300px', borderRadius: '10px', border: '1px solid var(--border)' }} />
    </div>
  </div>
);
