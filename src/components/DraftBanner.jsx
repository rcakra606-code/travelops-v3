import { RotateCcw, Trash2, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable banner shown inside forms/modals when an auto-saved sessionStorage draft exists.
 */
const DraftBanner = ({ hasSavedDraft, draftSavedAt, onRestore, onDiscard }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!hasSavedDraft) return null;

  const formattedTime = draftSavedAt
    ? new Date(draftSavedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.6rem',
        padding: '0.65rem 0.9rem',
        marginBottom: '1rem',
        borderRadius: '10px',
        background: isLight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.14)',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        fontSize: '0.8rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isLight ? '#b45309' : '#fbbf24' }}>
        <Clock size={15} />
        <span>
          <strong>Draft otomatis ditemukan</strong>
          {formattedTime ? ` (tersimpan pukul ${formattedTime})` : ''} — lanjutkan pengisian sebelumnya?
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <button
          type="button"
          onClick={onRestore}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '7px',
            border: 'none',
            background: '#f59e0b',
            color: '#ffffff',
            fontSize: '0.75rem',
            fontWeight: '700',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={12} /> Pulihkan
        </button>
        <button
          type="button"
          onClick={onDiscard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '7px',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            background: 'transparent',
            color: isLight ? '#92400e' : '#fcd34d',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <Trash2 size={12} /> Abaikan
        </button>
      </div>
    </div>
  );
};

export default DraftBanner;
