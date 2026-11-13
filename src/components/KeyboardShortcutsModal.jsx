import { useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SHORTCUTS = [
  {
    category: 'Navigasi Cepat & Pencarian',
    items: [
      { keys: ['Ctrl', 'K'], label: 'Buka Omni-Search / Command Palette (Semua Modul & PNR)' },
      { keys: ['Esc'], label: 'Tutup Dialog, Drawer, atau Modal yang sedang aktif' },
      { keys: ['?'], label: 'Buka Panduan Pintasan Keyboard ini' }
    ]
  },
  {
    category: 'Operasional & Tindakan Cepat',
    items: [
      { keys: ['Alt', 'N'], label: 'Menu Cepat: Tambah Tour, Dokumen, atau Reservasi Baru' },
      { keys: ['Ctrl', 'Shift', 'A'], label: 'Buka Asisten AI Copilot Operasional' },
      { keys: ['Enter'], label: 'Pilih hasil atau konfirmasi aksi aktif' }
    ]
  },
  {
    category: 'Kalender Operasional',
    items: [
      { keys: ['T'], label: 'Kembali ke Hari Ini di Kalender' },
      { keys: ['M'], label: 'Ganti Tampilan Kalender Bulanan' },
      { keys: ['W'], label: 'Ganti Tampilan Kalender Mingguan' }
    ]
  }
];

export const KeyboardShortcutsModal = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay fade-in"
      style={{
        zIndex: 999999,
        background: isLight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label="Panduan Pintasan Keyboard TravelOps"
        style={{
          maxWidth: '560px',
          width: '100%',
          background: isLight ? '#ffffff' : '#0b1329',
          border: `1.5px solid ${isLight ? '#e2e8f0' : 'rgba(56, 189, 248, 0.25)'}`,
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: isLight
            ? '0 25px 50px -12px rgba(2, 132, 199, 0.15)'
            : '0 25px 60px -15px rgba(0, 0, 0, 0.75)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Keyboard size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: isLight ? '#0f172a' : '#f8fafc', fontWeight: 800 }}>
                Pintasan Keyboard
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.785rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Navigasi cepat dan efisien untuk staf operasional
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: isLight ? '#64748b' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts Categories */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {SHORTCUTS.map((section) => (
            <div key={section.category}>
              <div
                style={{
                  fontSize: '0.725rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  marginBottom: '8px'
                }}
              >
                {section.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {section.items.map((item) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)'}`
                    }}
                  >
                    <span style={{ fontSize: '0.825rem', color: isLight ? '#334155' : '#cbd5e1' }}>
                      {item.label}
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          style={{
                            background: isLight ? '#ffffff' : '#1e293b',
                            color: isLight ? '#0f172a' : '#f8fafc',
                            border: `1px solid ${isLight ? '#cbd5e1' : '#475569'}`,
                            boxShadow: isLight ? '0 1px 2px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.4)',
                            borderRadius: '5px',
                            padding: '2px 7px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            fontFamily: 'Consolas, monospace'
                          }}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.785rem',
            color: isLight ? '#64748b' : '#94a3b8'
          }}
        >
          <span>💡 Tekan <kbd style={{ padding: '1px 5px', borderRadius: '4px', background: isLight ? '#f1f5f9' : '#1e293b' }}>?</kbd> kapan saja untuk membuka dialog ini.</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
