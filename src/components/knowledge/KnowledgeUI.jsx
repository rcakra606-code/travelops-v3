import { X } from 'lucide-react';

// Shared presentational primitives for the Travel Guide & Tips page.
// All inputs use theme variables so text stays readable in Light & Dark mode.

export const ModalShell = ({ title, subtitle, icon, accent = 'var(--primary)', onClose, maxWidth = '760px', children, footer }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div
      className="modal-content"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth, width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1.1rem 1.4rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
          {icon && (
            <div style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent, flexShrink: 0 }}>
              {icon}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>{title}</h2>
            {subtitle && <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{subtitle}</p>}
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>
      <div style={{ padding: '1.25rem 1.4rem', overflowY: 'auto', flex: 1 }}>{children}</div>
      {footer && (
        <div style={{ padding: '0.9rem 1.4rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', flexWrap: 'wrap' }}>
          {footer}
        </div>
      )}
    </div>
  </div>
);

const baseInput = {
  width: '100%',
  padding: '0.55rem 0.75rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-surface)',
  color: 'var(--text-main)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

export const Field = ({ label, hint, span = 1, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', gridColumn: span === 'full' ? '1 / -1' : `span ${span}` }}>
    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
    {children}
    {hint && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{hint}</span>}
  </label>
);

export const TextInput = ({ value, onChange, ...rest }) => (
  <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={baseInput} {...rest} />
);

export const TextArea = ({ value, onChange, rows = 3, ...rest }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows} style={{ ...baseInput, resize: 'vertical' }} {...rest} />
);

export const SelectInput = ({ value, onChange, options, placeholder, ...rest }) => (
  <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={baseInput} {...rest}>
    {placeholder !== undefined && <option value="">{placeholder}</option>}
    {options.map((o) => {
      const val = typeof o === 'string' ? o : o.value;
      const lbl = typeof o === 'string' ? o : o.label;
      return (
        <option key={val} value={val}>
          {lbl}
        </option>
      );
    })}
  </select>
);

export const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 0.75rem',
      borderRadius: 8,
      border: `1px solid ${checked ? 'var(--success)' : 'var(--border)'}`,
      background: checked ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
      color: checked ? 'var(--success)' : 'var(--text-subtle)',
      fontSize: '0.8rem',
      fontWeight: 700,
      cursor: 'pointer'
    }}
  >
    <span style={{ width: 14, height: 14, borderRadius: 4, border: '2px solid currentColor', background: checked ? 'currentColor' : 'transparent' }} />
    {label}
  </button>
);

export const Badge = ({ color = 'var(--primary)', children, title }) => (
  <span
    title={title}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      fontSize: '0.68rem',
      fontWeight: 700,
      padding: '0.18rem 0.5rem',
      borderRadius: 999,
      color,
      background: `color-mix(in srgb, ${color} 14%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
      whiteSpace: 'nowrap'
    }}
  >
    {children}
  </span>
);

export const Section = ({ icon, title, color = 'var(--primary)', children }) => (
  <div style={{ marginBottom: '1.1rem', border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem', background: 'var(--bg-surface)' }}>
    <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', color, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      {icon}
      {title}
    </h4>
    <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{children}</div>
  </div>
);

export const KV = ({ k, v }) =>
  v || v === 0 ? (
    <div style={{ display: 'flex', gap: '0.5rem', padding: '0.2rem 0' }}>
      <span style={{ minWidth: 120, color: 'var(--text-subtle)', fontWeight: 600 }}>{k}</span>
      <span style={{ flex: 1 }}>{v}</span>
    </div>
  ) : null;

export const BulletList = ({ items, empty = '—' }) =>
  items && items.length ? (
    <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
      {items.map((it, i) => (
        <li key={i} style={{ marginBottom: '0.2rem' }}>
          {it}
        </li>
      ))}
    </ul>
  ) : (
    <span style={{ color: 'var(--text-muted)' }}>{empty}</span>
  );

export const ConfirmModal = ({ open, title, message, confirmLabel = 'Delete', busy, onConfirm, onCancel }) =>
  open ? (
    <ModalShell
      title={title}
      onClose={onCancel}
      maxWidth="440px"
      accent="var(--danger, #ef4444)"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={onConfirm} disabled={busy} style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-main)' }}>{message}</p>
    </ModalShell>
  ) : null;

