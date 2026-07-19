import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const AutoLogout = ({ children }) => {
  const { user, logout, verifySession } = useAuth();
  const { settings } = useSettings();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  const lastActivityTime = useRef(Date.now());

  const idleTimeoutMs = (settings?.idleTimeout || 15) * 60 * 1000;
  const warningTimeMs = 30 * 1000; // 30 seconds before logout

  const confirmActive = () => {
    setShowWarning(false);
    const now = Date.now();
    lastActivityTime.current = now;
    localStorage.setItem('travelops_last_activity', now.toString());
  };

  useEffect(() => {
    if (!user) {
      setShowWarning(false);
      localStorage.removeItem('travelops_last_activity');
      return;
    }

    // Check if they were already idle while the tab was closed
    const storedLastActivity = localStorage.getItem('travelops_last_activity');
    if (storedLastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(storedLastActivity, 10);
      if (timeSinceLastActivity >= idleTimeoutMs) {
        logout('Session expired due to inactivity while away.');
        return;
      }
      lastActivityTime.current = parseInt(storedLastActivity, 10);
    } else {
      localStorage.setItem('travelops_last_activity', Date.now().toString());
    }

    const handleActivity = () => {
      if (!showWarning) {
        const now = Date.now();
        lastActivityTime.current = now;
        localStorage.setItem('travelops_last_activity', now.toString());
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, handleActivity));

    // Single Device Login periodic check (every 3 minutes)
    const sessionCheckTimer = setInterval(() => {
      verifySession();
    }, 3 * 60 * 1000);

    // Idle check interval (checks every 5 seconds)
    const idleCheckTimer = setInterval(() => {
      if (showWarning) return;
      const now = Date.now();
      if (now - lastActivityTime.current >= idleTimeoutMs - warningTimeMs) {
        setShowWarning(true);
        setCountdown(30);
      }
    }, 5000);

    return () => {
      events.forEach(e => document.removeEventListener(e, handleActivity));
      clearInterval(sessionCheckTimer);
      clearInterval(idleCheckTimer);
    };
  }, [user, showWarning, idleTimeoutMs, verifySession, logout]);

  useEffect(() => {
    let warningTimer;
    if (showWarning) {
      warningTimer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(warningTimer);
            logout('You were logged out due to inactivity.');
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (warningTimer) clearInterval(warningTimer);
    };
  }, [showWarning, logout]);

  return (
    <>
      {children}
      
      {showWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#1e293b', padding: '2rem', borderRadius: '16px',
            border: '1px solid #ef4444', textAlign: 'center', maxWidth: '400px', width: '90%'
          }}>
            <h2 style={{ color: '#ef4444', margin: '0 0 1rem 0' }}>Are you still there?</h2>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem' }}>
              Your session has been idle and will expire in <strong>{countdown} seconds</strong>.
            </p>
            <button 
              onClick={confirmActive}
              style={{
                background: '#3b82f6', color: 'white', border: 'none',
                padding: '0.75rem 2rem', borderRadius: '8px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '1rem', width: '100%'
              }}
            >
              I'm still here
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoLogout;
