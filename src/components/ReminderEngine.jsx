import React, { useEffect, useState, useCallback } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useAuth } from '../context/AuthContext';

const ReminderEngine = () => {
  const { settings } = useSettings();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [showToast, setShowToast] = useState(false);

  const runRemindersCheck = useCallback(async (isManual = false) => {
    const isEnabled = settings?.enableReminders !== false;
    if (!isEnabled && !isManual) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDiffDays = (targetDate) => {
      if (!targetDate) return null;
      const target = new Date(targetDate);
      if (isNaN(target.getTime())) return null;
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    const targetIntervals = [30, 15, 7, 5, 3, 2, 1, 0]; // 0 is departure / sailing day

    const newLogs = [];

    const checkItem = (item, type) => {
      const departureDate = type === 'Tour' ? item.departureDate : item.sailingStart;
      const returnDate = type === 'Tour' ? item.returnDate : item.sailingEnd;

      if (!departureDate || !returnDate) return;

      const diffDep = getDiffDays(departureDate);
      const diffRet = getDiffDays(returnDate);

      const title = type === 'Tour' 
        ? (item.tourCode || item.bookingCode || `Tour #${item.id}`) 
        : (item.bookingRef ? `${item.cruiseBrand ? item.cruiseBrand + ' ' : ''}(${item.bookingRef})` : (item.shipName || `Cruise #${item.id}`));

      if (diffDep !== null && targetIntervals.includes(diffDep)) {
        let msg = diffDep === 0 
          ? `TODAY is departure day for ${type} ${title}!` 
          : `Departure for ${type} ${title} is in ${diffDep} day${diffDep > 1 ? 's' : ''}.`;
        newLogs.push(msg);
      }

      if (diffRet === 0) {
        newLogs.push(`TODAY is the return day for ${type} ${title}!`);
      }
    };

    if (Array.isArray(tours)) {
      tours.forEach(t => checkItem(t, 'Tour'));
    }
    if (Array.isArray(cruises)) {
      cruises.forEach(c => checkItem(c, 'Cruise'));
    }

    const host = settings?.smtpHost || 'smtp.gmail.com';
    const port = settings?.smtpPort || 587;
    const userEmail = settings?.smtpUser;
    const userPass = settings?.smtpPass;
    const senderName = settings?.smtpSenderName || 'TravelOps System';

    if (newLogs.length > 0) {
      console.log('--- SMTP AUTOMATED REMINDERS ---');
      console.log(`Using SMTP Server: ${host}:${port}`);
      newLogs.forEach(l => console.log(`Reminder: ${l}`));
      setLogs(newLogs);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 9000);

      // If SMTP credentials are configured, dispatch reminder notice
      if (userEmail && userPass && userEmail !== 'your_email@gmail.com') {
        try {
          const targetRecipient = user?.email || userEmail;
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: targetRecipient,
              subject: `[TRAVELOPS] Milestone Reminders Notice (${newLogs.length} milestones)`,
              text: `TravelOps Automated Reminders Notice\n\nThe following milestones are due:\n${newLogs.map(l => `• ${l}`).join('\n')}`,
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h3 style="color: #0284c7; margin-top: 0;">✈️ TravelOps Milestone Reminders</h3>
                  <p>The following automated operations milestones have been detected for today:</p>
                  <ul style="background: #f8fafc; padding: 15px 25px; border-radius: 6px;">
                    ${newLogs.map(l => `<li style="margin: 6px 0; color: #0f172a; font-weight: 500;">${l}</li>`).join('')}
                  </ul>
                  <p style="font-size: 0.8rem; color: #94a3b8;">Dispatched via ${host}:${port}</p>
                </div>
              `,
              smtpConfig: {
                host,
                port,
                user: userEmail,
                pass: userPass,
                senderName
              }
            })
          }).catch(e => console.error('[ReminderEngine email error]', e));
        } catch (e) {
          console.error('[ReminderEngine dispatch error]', e);
        }
      }
    } else if (isManual) {
      setLogs(['All tours and cruises checked. No milestone reminders are due today!']);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    }

    if (!isManual) {
      sessionStorage.setItem('travelops_reminders_run', 'true');
    }
  }, [settings, tours, cruises, user]);

  useEffect(() => {
    const isEnabled = settings?.enableReminders !== false;
    if (!isEnabled) return;

    const hasRunToday = sessionStorage.getItem('travelops_reminders_run');
    if (hasRunToday) return;

    runRemindersCheck(false);
  }, [runRemindersCheck, settings]);

  useEffect(() => {
    const handleManualEvent = () => {
      runRemindersCheck(true);
    };

    window.addEventListener('trigger-reminders-check', handleManualEvent);
    return () => window.removeEventListener('trigger-reminders-check', handleManualEvent);
  }, [runRemindersCheck]);

  if (!showToast || logs.length === 0) return null;

  const host = settings?.smtpHost || 'smtp.gmail.com';

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1e293b',
      border: '1px solid #3b82f6',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      maxWidth: '380px',
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.4rem', borderRadius: '50%', color: '#3b82f6', display: 'flex' }}>
            📧
          </div>
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: '600' }}>Automated Reminders Check</h4>
        </div>
        <button 
          onClick={() => setShowToast(false)}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.85rem', color: '#cbd5e1' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> 
            <span>{log}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        (Processed via {host})
      </div>
    </div>
  );
};

export default ReminderEngine;
