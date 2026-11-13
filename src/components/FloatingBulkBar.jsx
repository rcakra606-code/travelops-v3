import { CheckSquare, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const FloatingBulkBar = ({
  count = 0,
  itemLabel = 'item',
  onClear,
  children
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!count || count <= 0) return null;

  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 18px',
        borderRadius: '16px',
        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: isLight ? '1px solid #bfdbfe' : '1px solid rgba(56, 189, 248, 0.3)',
        boxShadow: isLight
          ? '0 12px 30px -4px rgba(2, 132, 199, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          : '0 20px 35px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.2)',
        maxWidth: '92vw',
        flexWrap: 'wrap'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: 'var(--primary)',
            color: '#ffffff'
          }}
        >
          <CheckSquare size={16} />
        </div>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
          {count} {itemLabel} terpilih
        </span>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '6px',
              border: 'none',
              background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              fontWeight: 500
            }}
            title="Batalkan semua pilihan"
          >
            <X size={12} /> Batal
          </button>
        )}
      </div>

      <div
        style={{
          width: '1px',
          height: '20px',
          background: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.15)'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
};

export default FloatingBulkBar;
