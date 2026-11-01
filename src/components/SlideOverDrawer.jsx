import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SlideOverDrawer = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '520px'
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="slide-drawer-backdrop"
        onClick={onClose}
        style={{
          background: isLight ? 'rgba(11, 21, 40, 0.38)' : 'rgba(3, 7, 18, 0.65)'
        }}
      />

      {/* Drawer Panel */}
      <div
        className="slide-drawer-panel"
        style={{
          width: `min(${width}, 100vw)`,
          background: isLight ? '#ffffff' : 'var(--bg-surface)',
          boxShadow: isLight
            ? '-12px 0 42px rgba(0, 119, 255, 0.16)'
            : '-10px 0 40px rgba(0, 0, 0, 0.65)',
          animation: 'slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: isLight ? '#f4f9ff' : 'rgba(56, 189, 248, 0.04)'
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: '800',
                color: 'var(--text-main)',
                letterSpacing: '-0.01em'
              }}
            >
              {title}
            </h3>
            {subtitle && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
            title="Close (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {children}
        </div>

        {/* Optional Sticky Footer Actions */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: isLight ? '#f8fbff' : 'rgba(5, 8, 17, 0.55)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem'
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default SlideOverDrawer;
