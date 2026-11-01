import { useState } from 'react';
import { X, Check, Copy, AlertTriangle, ShieldCheck, ShieldAlert, Clock, User, Tag } from 'lucide-react';
import SlideOverDrawer from '../SlideOverDrawer';

// eslint-disable-next-line react-refresh/only-export-components
export const baseInputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, box-shadow 0.2s'
};

// Form Field Wrapper
export const FormField = ({ label, hint, required, span = 1, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', gridColumn: span === 'full' ? '1 / -1' : `span ${span}` }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {label}
      {required && <span style={{ color: 'var(--danger, #ef4444)' }}>*</span>}
    </label>
    {children}
    {hint && <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>{hint}</span>}
  </div>
);

// Card Section Wrapper with Neon Blue Accent
export const SettingsSection = ({ icon, title, description, badge, neonBlue, children }) => (
  <div className="card" style={{ padding: '1.4rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        {icon && (
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `color-mix(in srgb, ${neonBlue} 14%, transparent)`,
            color: neonBlue
          }}>
            {icon}
          </div>
        )}
        <div>
          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
          {description && <p style={{ margin: '0.15rem 0 0', color: 'var(--text-subtle)', fontSize: '0.78rem' }}>{description}</p>}
        </div>
      </div>
      {badge && <div>{badge}</div>}
    </div>
    {children}
  </div>
);

// Themed Confirmation Modal for Destructive Actions
export const SettingsConfirmModal = ({
  open,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Proceed',
  confirmVariant = 'danger', // 'danger' | 'primary'
  busy = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  const isDanger = confirmVariant === 'danger';
  const accentColor = isDanger ? '#ef4444' : 'var(--primary)';

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '92%',
          background: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{
          padding: '1.1rem 1.4rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: `color-mix(in srgb, ${accentColor} 8%, transparent)`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: `color-mix(in srgb, ${accentColor} 20%, transparent)`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{title}</h3>
          </div>
          <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.4rem', fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: 1.55 }}>
          {message}
        </div>

        <div style={{
          padding: '0.85rem 1.4rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.65rem'
        }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={busy}
            style={{
              background: isDanger ? '#ef4444' : undefined,
              borderColor: isDanger ? '#ef4444' : undefined,
              color: '#fff'
            }}
          >
            {busy ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Interactive Live Password Strength Checker against active Policy
export const PasswordPolicyMeter = ({ policy }) => {
  const [testPassword, setTestPassword] = useState('');

  const minLength = Number(policy.passwordMinLength) || 8;
  const requireNumbers = Boolean(policy.passwordRequireNumbers);
  const requireSymbols = Boolean(policy.passwordRequireSymbols);

  const hasLength = testPassword.length >= minLength;
  const hasNumber = !requireNumbers || /\d/.test(testPassword);
  const hasSymbol = !requireSymbols || /[!@#$%^&*(),.?":{}|<>]/.test(testPassword);
  const isFullyCompliant = testPassword.length > 0 && hasLength && hasNumber && hasSymbol;

  return (
    <div style={{
      background: 'color-mix(in srgb, var(--bg-surface) 80%, transparent)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '1rem',
      marginTop: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          Interactive Policy Compliance Simulator
        </span>
        {testPassword && (
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: isFullyCompliant ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            {isFullyCompliant ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
            {isFullyCompliant ? 'Meets Policy' : 'Incomplete'}
          </span>
        )}
      </div>

      <input
        type="text"
        placeholder="Type a sample password to live-test configured policy..."
        value={testPassword}
        onChange={(e) => setTestPassword(e.target.value)}
        style={{ ...baseInputStyle, marginBottom: '0.75rem', fontSize: '0.82rem' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasLength ? '#10b981' : 'var(--text-muted)' }}>
          <span style={{ width: 14, height: 14, borderRadius: '50%', background: hasLength ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLength ? '✓' : '•'}
          </span>
          Min length: {minLength} chars {testPassword && `(${testPassword.length})`}
        </div>

        {requireNumbers && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasNumber ? '#10b981' : 'var(--text-muted)' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: hasNumber ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasNumber ? '✓' : '•'}
            </span>
            Contains numbers (0-9)
          </div>
        )}

        {requireSymbols && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: hasSymbol ? '#10b981' : 'var(--text-muted)' }}>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: hasSymbol ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {hasSymbol ? '✓' : '•'}
            </span>
            Contains special symbols
          </div>
        )}
      </div>
    </div>
  );
};

// SlideOver Drawer Inspector for Deep Log Inspection
export const LogDetailsDrawer = ({ log, isOpen, onClose, neonBlue, toast }) => {
  const [copied, setCopied] = useState(false);
  if (!log) return <SlideOverDrawer isOpen={false} onClose={onClose} title="" />;

  const copyDetails = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopied(true);
      toast.success('Log payload copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Clipboard copy failed');
    }
  };

  const formattedDate = log.timestamp ? new Date(log.timestamp).toLocaleString() : '—';

  return (
    <SlideOverDrawer
      isOpen={isOpen}
      onClose={onClose}
      width="560px"
      title={log.action || 'Audit Event Details'}
      subtitle={`Logged at ${formattedDate}`}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button type="button" className="btn btn-secondary" onClick={copyDetails} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy JSON'}
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          background: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: '10px',
          border: '1px solid var(--border)'
        }}>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <User size={12} /> Initiated By
            </span>
            <strong style={{ fontSize: '0.9rem', color: neonBlue }}>{log.user || 'System'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Timestamp
            </span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{formattedDate}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Tag size={12} /> Action Category
            </span>
            <span style={{
              display: 'inline-block',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              background: `color-mix(in srgb, ${neonBlue} 15%, transparent)`,
              color: neonBlue,
              marginTop: '0.2rem'
            }}>
              {log.action}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Log ID</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{log.id || 'N/A'}</div>
          </div>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Event Narrative / Details
          </h4>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-main)',
            lineHeight: 1.6
          }}>
            {log.details || 'No detailed message recorded for this event.'}
          </div>
        </div>

        {log.metadata && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Raw Event Metadata
            </h4>
            <pre style={{
              margin: 0,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '1rem',
              fontSize: '0.75rem',
              color: 'var(--text-subtle)',
              fontFamily: 'monospace',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {typeof log.metadata === 'object' ? JSON.stringify(log.metadata, null, 2) : String(log.metadata)}
            </pre>
          </div>
        )}
      </div>
    </SlideOverDrawer>
  );
};
