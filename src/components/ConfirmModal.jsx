import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ConfirmModal = ({
  isOpen,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan? Tindakan ini mungkin tidak dapat dibatalkan.',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  confirmVariant = 'danger', // 'danger' | 'primary' | 'warning'
  onConfirm,
  onCancel
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Handle ESC key to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = confirmVariant === 'danger';
  const isWarning = confirmVariant === 'warning';

  const badgeBg = isDanger
    ? isLight ? '#fef2f2' : 'rgba(239, 68, 68, 0.15)'
    : isWarning
      ? isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.15)'
      : isLight ? '#eff6ff' : 'rgba(56, 189, 248, 0.15)';

  const badgeColor = isDanger
    ? '#ef4444'
    : isWarning
      ? '#f59e0b'
      : '#0284c7';

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 10000,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
      onClick={onCancel}
    >
      <div
        className="modal-content fade-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '1.5rem',
          borderRadius: '16px',
          background: isLight ? '#ffffff' : '#0f172a',
          border: isLight ? '1px solid #e2e8f0' : '1px solid #1e293b',
          boxShadow: isLight
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: badgeBg,
              color: badgeColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: '0 0 0.35rem 0',
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-main)'
              }}
            >
              {title}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.55
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.15rem',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: isWarning ? '#d97706' : undefined,
              borderColor: isWarning ? '#d97706' : undefined
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
