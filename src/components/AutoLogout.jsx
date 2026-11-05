import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useTheme } from '../context/ThemeContext';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';

const AutoLogout = ({ children }) => {
  const { user, logout, verifySession } = useAuth();
  const { settings } = useSettings();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const neonBlue = isLight ? '#0284c7' : '#00d4ff';

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const lastActivityTime = useRef(0);
  const isLoggingOutRef = useRef(false);

  // Default idle timeout from workspace settings (15 mins fallback)
  const idleTimeoutMs = (settings?.idleTimeout || 15) * 60 * 1000;
  const warningDurationSec = 30;
  const warningTimeMs = warningDurationSec * 1000;

  // Initialize activity timestamp on mount
  useEffect(() => {
    lastActivityTime.current = Date.now();
  }, []);

  // Dismiss modal and renew active token
  const confirmActive = useCallback(() => {
    setShowWarning(false);
    setCountdown(warningDurationSec);
    const now = Date.now();
    lastActivityTime.current = now;
    try {
      localStorage.setItem('travelops_last_activity', now.toString());
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [warningDurationSec]);

  // Explicit user sign out from warning prompt
  const handleImmediateLogout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    setShowWarning(false);
    logout('Logged out voluntarily from session warning.');
  }, [logout]);

  // Main activity tracker & idle detector
  useEffect(() => {
    if (!user) {
      isLoggingOutRef.current = false;
      try {
        localStorage.removeItem('travelops_last_activity');
      } catch {
        // Ignore
      }
      return;
    }

    // Check if operator was already idle while away or tab was asleep
    try {
      const storedLastActivity = localStorage.getItem('travelops_last_activity');
      if (storedLastActivity) {
        const timeSince = Date.now() - parseInt(storedLastActivity, 10);
        if (timeSince >= idleTimeoutMs && !isLoggingOutRef.current) {
          isLoggingOutRef.current = true;
          logout('Session expired due to inactivity while away.');
          return;
        }
        lastActivityTime.current = parseInt(storedLastActivity, 10);
      } else {
        localStorage.setItem('travelops_last_activity', Date.now().toString());
      }
    } catch {
      // Storage unavailable
    }

    const handleActivity = () => {
      if (!showWarning && !isLoggingOutRef.current) {
        const now = Date.now();
        lastActivityTime.current = now;
        try {
          localStorage.setItem('travelops_last_activity', now.toString());
        } catch {
          // Ignore
        }
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));

    // Periodic session validity check (every 3 minutes)
    const sessionCheckTimer = setInterval(() => {
      if (!isLoggingOutRef.current) {
        verifySession();
      }
    }, 3 * 60 * 1000);

    // Idle monitor timer (checks every 5 seconds)
    const idleCheckTimer = setInterval(() => {
      if (showWarning || isLoggingOutRef.current) return;
      const now = Date.now();
      if (now - lastActivityTime.current >= idleTimeoutMs - warningTimeMs) {
        setShowWarning(true);
        setCountdown(warningDurationSec);
      }
    }, 5000);

    return () => {
      events.forEach(e => window.removeEventListener(e, handleActivity));
      clearInterval(sessionCheckTimer);
      clearInterval(idleCheckTimer);
    };
  }, [user, showWarning, idleTimeoutMs, warningTimeMs, warningDurationSec, verifySession, logout]);

  // Predictable Countdown Timer when warning modal is active
  useEffect(() => {
    if (!showWarning) return;

    if (countdown <= 0) {
      if (!isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        setShowWarning(false);
        logout('Session expired due to inactivity.');
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showWarning, countdown, logout]);

  return (
    <>
      {children}
      
      {showWarning && user && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(3, 7, 18, 0.78)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.25rem'
        }}>
          <div className="card fade-in" style={{
            background: isLight ? '#ffffff' : 'var(--bg-card)',
            padding: '2.25rem 2rem',
            borderRadius: '20px',
            border: `1px solid ${isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.35)'}`,
            textAlign: 'center',
            maxWidth: '440px',
            width: '100%',
            boxShadow: isLight 
              ? '0 25px 50px -12px rgba(245, 158, 11, 0.25), 0 0 0 1px rgba(245, 158, 11, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 35px rgba(245, 158, 11, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Top Amber Ambient Glow */}
            <div style={{
              position: 'absolute',
              top: '-35px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.18)',
              filter: 'blur(35px)',
              pointerEvents: 'none'
            }} />

            {/* Glowing Icon Header */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '18px',
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: '#f59e0b',
              boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
            }}>
              <Clock size={32} />
            </div>

            <h2 style={{
              color: 'var(--text-main)',
              fontSize: '1.35rem',
              fontWeight: '800',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}>
              Session Inactivity Warning
            </h2>

            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              margin: '0 0 1.25rem 0'
            }}>
              Your workstation has been idle. To protect operational data, your session will automatically disconnect in:
            </p>

            {/* Countdown Display Card */}
            <div style={{
              background: 'var(--bg-surface)',
              border: `1px solid ${countdown <= 10 ? 'rgba(239, 68, 68, 0.4)' : 'var(--border)'}`,
              borderRadius: '14px',
              padding: '1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.65rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: '900',
                color: countdown <= 10 ? '#ef4444' : '#f59e0b',
                fontFamily: 'monospace',
                lineHeight: 1
              }}>
                {countdown}
              </span>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                textAlign: 'left',
                lineHeight: 1.2
              }}>
                seconds<br /><span style={{ fontSize: '0.75rem', opacity: 0.8 }}>remaining</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button 
                type="button"
                onClick={confirmActive}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '0.925rem',
                  fontWeight: '700',
                  background: neonBlue,
                  borderColor: neonBlue,
                  color: '#ffffff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: `0 4px 16px ${neonBlue}40`
                }}
              >
                <CheckCircle2 size={18} /> I am Still Working
              </button>

              <button 
                type="button"
                onClick={handleImmediateLogout}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  fontSize: '0.825rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem'
                }}
              >
                <LogOut size={15} /> Sign Out Now
              </button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              marginTop: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-subtle)'
            }}>
              <ShieldAlert size={12} /> Governed by Workspace Security Policy
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default AutoLogout;
