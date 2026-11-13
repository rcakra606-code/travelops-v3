import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, Home, UserCheck } from 'lucide-react';

const RoleRoute = ({ children, allowedRoles = ['Admin'] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { theme } = useTheme();

  const isLight = theme === 'light';

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'var(--bg-dark)',
          gap: '12px'
        }}
      >
        <div
          className="spin"
          style={{
            width: '40px',
            height: '40px',
            border: '3.5px solid var(--primary-glow)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%'
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-muted)' }}>
          Memverifikasi hak akses...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = user.role || 'Staff';
  const hasAccess = allowedRoles.includes(userRole);

  if (!hasAccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: isLight ? '#f8fafc' : 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
          color: isLight ? '#0f172a' : '#f8fafc'
        }}
      >
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: isLight ? '#ffffff' : '#0b1329',
            border: `1.5px solid ${isLight ? '#fecaca' : '#ef444433'}`,
            borderRadius: '18px',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: isLight
              ? '0 12px 30px -10px rgba(239, 68, 68, 0.15)'
              : '0 20px 40px -15px rgba(239, 68, 68, 0.25)'
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <span
            style={{
              display: 'inline-block',
              background: isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.18)',
              color: '#ef4444',
              fontSize: '11px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '4px 12px',
              borderRadius: '20px',
              marginBottom: '12px'
            }}
          >
            403 &bull; Akses Terbatas
          </span>

          <h2
            style={{
              fontSize: '1.45rem',
              fontWeight: '800',
              margin: '0 0 10px 0',
              color: isLight ? '#0f172a' : '#f8fafc'
            }}
          >
            Hak Akses Dibatasi
          </h2>

          <p
            style={{
              fontSize: '0.9rem',
              lineHeight: '1.55',
              color: isLight ? '#64748b' : '#94a3b8',
              margin: '0 0 24px 0'
            }}
          >
            Halaman ini membutuhkan hak akses khusus:{' '}
            <strong style={{ color: '#ef4444' }}>
              {allowedRoles.join(' / ')}
            </strong>.
            Peran akun Anda saat ini adalah{' '}
            <span
              style={{
                background: isLight ? '#f1f5f9' : '#1e293b',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: '700',
                color: isLight ? '#334155' : '#cbd5e1'
              }}
            >
              {userRole}
            </span>. Silakan hubungi Administrator sistem jika Anda memerlukan akses ke modul ini.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                padding: '11px 20px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                transition: 'transform 0.2s'
              }}
            >
              <Home size={16} />
              Kembali ke Dashboard
            </Link>

            <Link
              to="/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isLight ? '#f1f5f9' : '#1e293b',
                color: isLight ? '#334155' : '#e2e8f0',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '0.875rem',
                padding: '11px 20px',
                borderRadius: '10px',
                border: `1px solid ${isLight ? '#cbd5e1' : '#334155'}`
              }}
            >
              <UserCheck size={16} />
              Lihat Profil Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default RoleRoute;
