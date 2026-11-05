import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Compass, Lock, Mail, AlertCircle, ArrowRight,
  Eye, EyeOff, Sun, Moon, Search, HelpCircle
} from 'lucide-react';
import loginBg from '../assets/login-bg.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoutNotice] = useState(() => {
    try {
      const reason = sessionStorage.getItem('travelops_logout_reason');
      if (reason) {
        sessionStorage.removeItem('travelops_logout_reason');
        return reason;
      }
    } catch {
      // Ignore
    }
    return '';
  });
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const isLight = theme === 'light';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Please double-check your email and password.');
      }
    } catch {
      setError('Something went wrong while signing you in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Soft Background Photo + Theme-Aware Neon Sky Veil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${loginBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: isLight ? 0.22 : 0.35,
          zIndex: 0
        }}
      />
      <div className="login-overlay" style={{ zIndex: 1 }} />

      {/* Top-Right Theme Switcher & Quick Tracker Shortcut */}
      <div
        style={{
          position: 'absolute',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem'
        }}
      >
        <Link
          to="/track"
          className="btn btn-secondary"
          style={{
            padding: '0.5rem 0.9rem',
            fontSize: '0.8rem',
            borderRadius: '9999px'
          }}
        >
          <Search size={14} color="var(--primary)" />
          <span>Track a Booking</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          title={isLight ? 'Switch to Obsidian Dark Mode' : 'Switch to Sky Light Mode'}
          className="btn btn-secondary"
          style={{
            width: '38px',
            height: '38px',
            padding: 0,
            borderRadius: '9999px'
          }}
        >
          {isLight ? <Moon size={16} color="var(--primary)" /> : <Sun size={16} color="#38bdf8" />}
        </button>
      </div>

      <div className="login-box glass" style={{ zIndex: 10 }}>
        {/* Brand Icon */}
        <div className="login-logo">
          <Compass size={30} strokeWidth={2.3} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.03em', color: 'var(--text-main)', margin: 0 }}>
            TravelOps
          </h1>
          <span
            className="badge badge-primary"
            style={{ fontSize: '0.68rem', padding: '0.12rem 0.5rem' }}
          >
            v3.4
          </span>
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '1.85rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
          Welcome back! Sign in to manage trips, guests, and travel documents with ease.
        </p>

        {logoutNotice && (
          <div
            style={{
              backgroundColor: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.14)',
              color: isLight ? '#b45309' : '#fbbf24',
              border: `1px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.35)'}`,
              padding: '0.8rem 1rem',
              borderRadius: '11px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.825rem',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{logoutNotice}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: isLight ? '#fff1f2' : 'rgba(244, 63, 94, 0.14)',
              color: isLight ? '#be123c' : '#fb7185',
              border: `1px solid ${isLight ? '#fecdd3' : 'rgba(244, 63, 94, 0.32)'}`,
              padding: '0.8rem 1rem',
              borderRadius: '11px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontSize: '0.825rem',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label htmlFor="login-email">Work Email</label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: '0.95rem',
                  color: 'var(--primary)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@agency.com"
                style={{ paddingLeft: '2.6rem', width: '100%' }}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  left: '0.95rem',
                  color: 'var(--primary)',
                  pointerEvents: 'none'
                }}
              />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{ paddingLeft: '2.6rem', paddingRight: '2.75rem', width: '100%' }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  right: '0.75rem',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', fontSize: '0.925rem' }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Signing you in...</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Continue to Workspace <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        {/* Friendly Guest Tracker Callout */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.9rem 1rem',
            borderRadius: '12px',
            background: isLight ? '#f0f7ff' : 'rgba(56, 189, 248, 0.08)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            textAlign: 'left'
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-main)' }}>
              Checking a trip or visa status?
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              No account needed for guests &amp; travelers.
            </div>
          </div>
          <Link
            to="/track"
            style={{
              fontSize: '0.8rem',
              fontWeight: '700',
              color: 'var(--primary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            Open Tracker <ArrowRight size={14} />
          </Link>
        </div>

        {/* Helpful Support Hint */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            color: 'var(--text-subtle)',
            fontSize: '0.775rem'
          }}
        >
          <HelpCircle size={14} color="var(--primary)" />
          <span>Need help signing in? Contact your agency administrator.</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
