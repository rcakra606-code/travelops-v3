import React, { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';

const ReminderEngine = () => {
  const { settings } = useSettings();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const [logs, setLogs] = useState([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Default setting is enabled (true) unless explicitly set to false
    const isEnabled = settings?.enableReminders !== false;
    if (!isEnabled) return;

    // To prevent spamming on every hot reload during dev,
    // run once per session on mount.
    const hasRunToday = sessionStorage.getItem('travelops_reminders_run');
    if (hasRunToday) return;

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

    if (newLogs.length > 0) {
      console.log('--- SMTP AUTOMATED REMINDERS ---');
      console.log(`Using SMTP Server: ${host}:${port}`);
      newLogs.forEach(l => console.log(`Sending Email: ${l}`));
      setLogs(newLogs);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000);
    }

    sessionStorage.setItem('travelops_reminders_run', 'true');
  }, [settings, tours, cruises]);

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
      maxWidth: '360px',
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.4rem', borderRadius: '50%', color: '#3b82f6', display: 'flex' }}>
            📧
          </div>
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '0.95rem', fontWeight: '600' }}>Automated Reminders Sent</h4>
        </div>
        <button 
          onClick={() => setShowToast(false)}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem', padding: '0 4px', lineHeight: 1 }}
        >
          ✕
        </button>
      </div>
      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: '#cbd5e1' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span> 
            <span>{log}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        (Simulated via {host})
      </div>
    </div>
  );
};

export default ReminderEngine;
