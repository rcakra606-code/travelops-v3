import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatusBanner = () => {
  const { isOnline, justReconnected } = useNetworkStatus();

  if (isOnline && !justReconnected) return null;

  return (
    <div
      className="no-print"
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.55rem 1.15rem',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: '700',
        letterSpacing: '0.01em',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)',
        background: isOnline
          ? 'linear-gradient(135deg, #059669 0%, #10b981 100%)'
          : 'linear-gradient(135deg, #be123c 0%, #e11d48 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        maxWidth: '92vw'
      }}
    >
      {isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}
      <span>
        {isOnline
          ? 'Koneksi internet pulih — sinkronisasi database kembali aktif.'
          : 'Koneksi internet terputus — perubahan mungkin gagal tersimpan ke server.'}
      </span>
    </div>
  );
};

export default NetworkStatusBanner;
