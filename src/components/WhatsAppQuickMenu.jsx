import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Copy, ExternalLink, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { getWhatsAppTemplates, buildWhatsAppUrl } from '../utils/waTemplateBuilder';

/**
 * Compact 1-click WhatsApp Operational Template Menu for SlideOverDrawers & Action Desk.
 * Allows staff to either copy the auto-filled template or open WhatsApp directly.
 */
const WhatsAppQuickMenu = ({
  moduleType,
  record,
  phone = '',
  compact = false,
  align = 'right',
  label = 'Kirim WA'
}) => {
  const { theme } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const containerRef = useRef(null);

  const templates = getWhatsAppTemplates(moduleType, record, user?.name || '');

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen]);

  if (!templates.length) return null;

  const targetPhone =
    phone ||
    record?.phoneNumber ||
    record?.phone ||
    record?.noHp ||
    record?.contactPhone ||
    record?.paxInfo?.[0]?.phone ||
    '';

  const handleCopy = async (tpl) => {
    try {
      await navigator.clipboard.writeText(tpl.message);
      setCopiedId(tpl.id);
      toast.success(`Template "${tpl.label}" disalin ke clipboard!`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Gagal menyalin pesan ke clipboard.');
    }
  };

  const handleOpenWa = (tpl) => {
    const url = buildWhatsAppUrl(tpl.message, targetPhone);
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          padding: compact ? '0.32rem 0.65rem' : '0.48rem 0.85rem',
          borderRadius: '9px',
          fontSize: compact ? '0.74rem' : '0.8rem',
          fontWeight: '700',
          cursor: 'pointer',
          border: '1px solid rgba(16, 185, 129, 0.38)',
          background: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.14)',
          color: isLight ? '#047857' : '#34d399',
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap'
        }}
        title="Template Pesan WhatsApp Otomatis"
      >
        <MessageCircle size={compact ? 13 : 15} />
        <span>{label}</span>
        <ChevronDown size={compact ? 11 : 13} />
      </button>

      {isOpen && (
        <div
          className="card glass fade-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            [align === 'left' ? 'left' : 'right']: 0,
            marginTop: '0.45rem',
            width: '310px',
            maxWidth: '88vw',
            padding: '0.5rem',
            borderRadius: '12px',
            zIndex: 90,
            border: '1px solid var(--border)',
            background: isLight ? '#ffffff' : '#0f172a',
            boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)'
          }}
        >
          <div
            style={{
              padding: '0.35rem 0.55rem 0.5rem',
              borderBottom: '1px solid var(--border)',
              marginBottom: '0.4rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)'
              }}
            >
              Template WhatsApp Cepat
            </span>
            {targetPhone ? (
              <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: '600' }}>
                No. HP Terdeteksi
              </span>
            ) : (
              <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>
                Pilih Kontak di WA
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                style={{
                  padding: '0.55rem 0.65rem',
                  borderRadius: '9px',
                  background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-main)' }}>
                    {tpl.label}
                  </span>
                  {tpl.badge && (
                    <span
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: '700',
                        padding: '0.1rem 0.42rem',
                        borderRadius: '9999px',
                        background: 'rgba(16, 185, 129, 0.14)',
                        color: isLight ? '#047857' : '#34d399',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {tpl.badge}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    onClick={() => handleCopy(tpl)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.5rem',
                      borderRadius: '7px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedId === tpl.id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                    {copiedId === tpl.id ? 'Tersalin!' : 'Salin Teks'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWa(tpl)}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      padding: '0.32rem 0.5rem',
                      borderRadius: '7px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink size={12} />
                    Buka WA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppQuickMenu;
