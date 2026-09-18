import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_ICONS = {
  success: <CheckCircle2 size={18} color="#10b981" />,
  error: <AlertCircle size={18} color="#ef4444" />,
  warning: <AlertTriangle size={18} color="#f59e0b" />,
  info: <Info size={18} color="#06b6d4" />
};

const TOAST_BORDERS = {
  success: 'rgba(16, 185, 129, 0.4)',
  error: 'rgba(239, 68, 68, 0.4)',
  warning: 'rgba(245, 158, 11, 0.4)',
  info: 'rgba(6, 182, 212, 0.4)'
};

const ToastNotification = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-floating-container">
      {toasts.map((t) => (
        <div 
          key={t.id} 
          className="toast-item-card"
          style={{
            borderColor: TOAST_BORDERS[t.type] || 'var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {TOAST_ICONS[t.type] || TOAST_ICONS.info}
            <span style={{ fontWeight: '600', lineHeight: '1.4' }}>{t.message}</span>
          </div>
          <button
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
            title="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;
