import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, RotateCcw } from 'lucide-react';

const TOAST_ICONS = {
  success: <CheckCircle2 size={18} color="#10b981" />,
  error: <AlertCircle size={18} color="#ef4444" />,
  warning: <AlertTriangle size={18} color="#f59e0b" />,
  info: <Info size={18} color="#38bdf8" />
};

const TOAST_BORDERS = {
  success: 'rgba(16, 185, 129, 0.45)',
  error: 'rgba(239, 68, 68, 0.45)',
  warning: 'rgba(245, 158, 11, 0.45)',
  info: 'rgba(56, 189, 248, 0.5)'
};

const ToastNotification = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-floating-container" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-item-card"
          style={{
            borderColor: TOAST_BORDERS[t.type] || 'var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
            <span style={{ flexShrink: 0, display: 'flex' }}>
              {TOAST_ICONS[t.type] || TOAST_ICONS.info}
            </span>
            <span style={{ fontWeight: '600', lineHeight: '1.4', fontSize: '0.84rem' }}>{t.message}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            {t.actionLabel && typeof t.onAction === 'function' && (
              <button
                type="button"
                onClick={async () => {
                  const fn = t.onAction;
                  removeToast(t.id);
                  try {
                    await fn();
                  } catch (err) {
                    console.error('Toast action error:', err);
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.28rem 0.62rem',
                  borderRadius: '7px',
                  border: '1px solid rgba(56, 189, 248, 0.45)',
                  background: 'rgba(56, 189, 248, 0.14)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <RotateCcw size={12} />
                {t.actionLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Tutup"
              aria-label="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
