import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const AutoLogout = ({ children }) => {
  const { user, logout, verifySession } = useAuth();
  const { settings } = useSettings();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(30);
  
  const activityTimer = useRef(null);
  const warningTimer = useRef(null);
  const sessionCheckTimer = useRef(null);

  const idleTimeoutMs = (settings?.idleTimeout || 15) * 60 * 1000;
  const warningTimeMs = 30 * 1000; // 30 seconds before logout

  const resetActivity = useCallback(() => {
    if (!user) return;
    
    // If warning is already showing, do not reset via mouse movements
    if (showWarning) return;

    if (activityTimer.current) clearTimeout(activityTimer.current);
    
    // Set timer to show warning
    activityTimer.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(30);
    }, idleTimeoutMs - warningTimeMs);
  }, [user, idleTimeoutMs, warningTimeMs, showWarning]);

  const confirmActive = () => {
    setShowWarning(false);
    if (warningTimer.current) clearInterval(warningTimer.current);
    resetActivity();
  };

  useEffect(() => {
    if (!user) {
      if (activityTimer.current) clearTimeout(activityTimer.current);
      if (warningTimer.current) clearInterval(warningTimer.current);
      if (sessionCheckTimer.current) clearInterval(sessionCheckTimer.current);
      setShowWarning(false);
      return;
    }

    // Single Device Login periodic check
    sessionCheckTimer.current = setInterval(() => {
      verifySession();
    }, 15000); // check every 15 seconds

    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetActivity));
    
    // Start initial timer
    resetActivity();

    return () => {
      events.forEach(e => document.removeEventListener(e, resetActivity));
      if (activityTimer.current) clearTimeout(activityTimer.current);
      if (warningTimer.current) clearInterval(warningTimer.current);
      if (sessionCheckTimer.current) clearInterval(sessionCheckTimer.current);
    };
  }, [user, resetActivity, verifySession]);

  useEffect(() => {
    if (showWarning) {
      warningTimer.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(warningTimer.current);
            logout('You were logged out due to inactivity.');
            setShowWarning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (warningTimer.current) clearInterval(warningTimer.current);
    }
    return () => {
      if (warningTimer.current) clearInterval(warningTimer.current);
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
