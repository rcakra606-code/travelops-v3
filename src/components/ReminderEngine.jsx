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
    if (!settings.enableReminders) return;

    // To prevent spamming the user on every hot reload during dev,
    // we use a flag in memory, or we can use localStorage to track the last run date.
    // For demonstration, we'll run it once per session on mount.
    const hasRunToday = sessionStorage.getItem('travelops_reminders_run');
    if (hasRunToday) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getDiffDays = (targetDate) => {
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);
      const diffTime = target - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const targetIntervals = [30, 15, 7, 5, 3, 2, 1, 0]; // 0 is departure day

    const newLogs = [];

    const checkItem = (item, type) => {
      if (!item.departureDate || !item.returnDate) return;

      const diffDep = getDiffDays(item.departureDate);
      const diffRet = getDiffDays(item.returnDate);

      const title = type === 'Tour' ? item.tourCode : item.code;

      if (targetIntervals.includes(diffDep)) {
        let msg = diffDep === 0 
          ? `TODAY is departure day for ${type} ${title}!` 
          : `Departure for ${type} ${title} is in ${diffDep} days.`;
        newLogs.push(msg);
      }

      if (diffRet === 0) {
        newLogs.push(`TODAY is the return day for ${type} ${title}!`);
      }
    };

    tours.forEach(t => checkItem(t, 'Tour'));
    cruises.forEach(c => checkItem(c, 'Cruise'));

    if (newLogs.length > 0) {
      console.log('--- SMTP AUTOMATED REMINDERS ---');
      console.log(`Using SMTP Server: ${settings.smtpHost}:${settings.smtpPort}`);
      newLogs.forEach(l => console.log(`Sending Email: ${l}`));
      setLogs(newLogs);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000);
    }

    sessionStorage.setItem('travelops_reminders_run', 'true');
  }, [settings, tours, cruises]);

  if (!showToast) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#1e293b',
      border: '1px solid #3b82f6',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
      zIndex: 9999,
      maxWidth: '350px',
      animation: 'slideUp 0.5s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
        <div style={{ background: '#3b82f620', padding: '0.5rem', borderRadius: '50%', color: '#3b82f6' }}>
          📧
        </div>
        <h4 style={{ margin: 0, color: '#f8fafc' }}>Automated Reminders Sent</h4>
      </div>
      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.85rem', color: '#cbd5e1' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#10b981' }}>✓</span> {log}
          </div>
        ))}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        (Simulated via {settings.smtpHost})
      </div>
    </div>
  );
};

export default ReminderEngine;
