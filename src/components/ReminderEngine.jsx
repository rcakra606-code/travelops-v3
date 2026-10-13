import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, CheckCircle2, AlertTriangle, Calendar, Bell, X } from 'lucide-react';

const ReminderEngine = () => {
  const { settings } = useSettings();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState(null); // 'sent' | 'failed' | null
  const hasTriggeredRef = useRef(false);

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

    const milestoneItems = [];
    const logMessages = [];

    const checkItem = (item, type) => {
      const departureDate = type === 'Tour' ? item.departureDate : item.sailingStart;
      const returnDate = type === 'Tour' ? item.returnDate : item.sailingEnd;

      if (!departureDate && !returnDate) return;

      const diffDep = departureDate ? getDiffDays(departureDate) : null;
      const diffRet = returnDate ? getDiffDays(returnDate) : null;

      const code = type === 'Tour' 
        ? (item.tourCode || item.bookingCode || `Tour #${item.id}`) 
        : (item.bookingRef || `Cruise #${item.id}`);

      const destination = item.country || item.route || item.destination || '-';
      const status = item.status || 'Active';

      // Skip cancelled or already archived past tours
      if (['Cancel', 'Cancelled', 'Past Date'].includes(status)) return;

      if (diffDep !== null && targetIntervals.includes(diffDep)) {
        const milestoneLabel = diffDep === 0 
          ? 'TODAY: Departure Day' 
          : `Departure in ${diffDep} day${diffDep > 1 ? 's' : ''} (H-${diffDep})`;

        const message = `${type} ${code} to ${destination}: ${milestoneLabel}`;
        logMessages.push(message);

        milestoneItems.push({
          type,
          code,
          destination,
          date: departureDate,
          diff: diffDep,
          milestone: milestoneLabel,
          status,
          pax: item.paxCount || (item.paxInfo ? item.paxInfo.length : 1)
        });
      }

      if (diffRet === 0) {
        const message = `TODAY: Return day for ${type} ${code} (${destination})`;
        logMessages.push(message);

        milestoneItems.push({
          type,
          code,
          destination,
          date: returnDate,
          diff: 0,
          milestone: 'TODAY: Return Day',
          status,
          pax: item.paxCount || 1
        });
      }
    };

    if (Array.isArray(tours)) {
      tours.forEach(t => checkItem(t, 'Tour'));
    }
    if (Array.isArray(cruises)) {
      cruises.forEach(c => checkItem(c, 'Cruise'));
    }

    const host = settings?.smtpHost || 'smtp.gmail.com';
    const port = Number(settings?.smtpPort || 587);
    const userEmail = settings?.smtpUser;
    const userPass = settings?.smtpPass;
    const senderName = settings?.smtpSenderName || 'TravelOps System';

    // Target recipient: prioritized to notificationEmail -> logged-in user email -> smtpUser
    const targetRecipient = settings?.notificationEmail || user?.email || userEmail;

    if (milestoneItems.length > 0) {
      setLogs(logMessages);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 8000);

      // Construct clean HTML email
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">✈️</span>
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">TravelOps Operations</h2>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Automated Milestone Reminders</p>
              </div>
            </div>
            <span style="background: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 6px;">
              ${milestoneItems.length} Milestone${milestoneItems.length > 1 ? 's' : ''} Today
            </span>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 16px;">
            Hello, the following operational milestones have been detected for your scheduled tours and cruises today (<strong>${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>):
          </p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <thead>
              <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; text-align: left;">
                <th style="padding: 10px 8px; color: #475569;">Type & Code</th>
                <th style="padding: 10px 8px; color: #475569;">Destination</th>
                <th style="padding: 10px 8px; color: #475569;">Target Date</th>
                <th style="padding: 10px 8px; color: #475569;">Milestone</th>
              </tr>
            </thead>
            <tbody>
              ${milestoneItems.map(m => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${m.type} ${m.code}</td>
                  <td style="padding: 10px 8px; color: #334155;">${m.destination}</td>
                  <td style="padding: 10px 8px; font-family: monospace; color: #0284c7;">${m.date}</td>
                  <td style="padding: 10px 8px;">
                    <span style="background: ${m.diff === 0 ? '#fee2e2' : m.diff <= 3 ? '#fef3c7' : '#ecfdf5'}; color: ${m.diff === 0 ? '#b91c1c' : m.diff <= 3 ? '#b45309' : '#047857'}; font-weight: 700; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                      ${m.milestone}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 12px; color: #64748b;">
              Recipient: <strong>${targetRecipient}</strong> • Dispatched by TravelOps Automated Dispatcher via ${host}:${port}
            </p>
          </div>

          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            This is an automated system notification from TravelOps Operations Suite.
          </p>
        </div>
      `;

      if (targetRecipient) {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: targetRecipient,
              subject: `[TRAVELOPS] Daily Milestone Reminders (${milestoneItems.length} Due Today)`,
              text: `TravelOps Automated Reminders Notice\n\nThe following milestones are due:\n${logMessages.map(l => `• ${l}`).join('\n')}\n\nRecipient: ${targetRecipient}`,
              html: emailHtml,
              smtpConfig: (userEmail && userPass) ? {
                host,
                port,
                user: userEmail,
                pass: userPass,
                senderName
              } : undefined
            })
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok && data.success) {
            setEmailDeliveryStatus('sent');
            const todayStr = new Date().toISOString().split('T')[0];
            localStorage.setItem(`travelops_reminders_sent_${targetRecipient}_${todayStr}`, 'true');
            if (isManual) {
              toast?.success(`Reminder email delivered to ${targetRecipient}!`);
            }
          } else {
            setEmailDeliveryStatus('failed');
            console.warn('[ReminderEngine] Email delivery failed:', data.error);
            if (isManual) {
              toast?.error(`Email dispatch failed: ${data.error || 'Check SMTP settings'}`);
            }
          }
        } catch (err) {
          setEmailDeliveryStatus('failed');
          console.error('[ReminderEngine] Network error sending reminder email:', err);
        }
      }
    } else if (isManual) {
      setLogs(['All tours and cruises checked. No milestone reminders are due today!']);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      toast?.info('Reminders check complete: No upcoming milestones due today.');
    }
  }, [settings, tours, cruises, user, toast]);

  // Automated Daily Check: triggers once per user per calendar day
  useEffect(() => {
    if (authLoading) return;
    if (!tours || tours.length === 0) return;
    if (hasTriggeredRef.current) return;

    const isEnabled = settings?.enableReminders !== false;
    if (!isEnabled) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const targetRecipient = settings?.notificationEmail || user?.email || settings?.smtpUser;
    
    if (targetRecipient) {
      const sentKey = `travelops_reminders_sent_${targetRecipient}_${todayStr}`;
      const hasSentToday = localStorage.getItem(sentKey);
      if (hasSentToday) return;
    }

    hasTriggeredRef.current = true;
    runRemindersCheck(false);
  }, [authLoading, tours, settings, user, runRemindersCheck]);

  // Support manual trigger from Settings page
  useEffect(() => {
    const handleManualEvent = () => {
      runRemindersCheck(true);
    };

    window.addEventListener('trigger-reminders-check', handleManualEvent);
    return () => window.removeEventListener('trigger-reminders-check', handleManualEvent);
  }, [runRemindersCheck]);

  if (!showToast || logs.length === 0) return null;

  const targetRecipient = settings?.notificationEmail || user?.email || settings?.smtpUser || 'user email';

  return (
    <div 
      className="card fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--primary)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        maxWidth: '380px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '6px', 
            background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Bell size={15} />
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '700' }}>
              Operations Reminders
            </h4>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
              {emailDeliveryStatus === 'sent' ? `Email sent to ${targetRecipient}` : `Target: ${targetRecipient}`}
            </span>
          </div>
        </div>
        <button 
          onClick={() => setShowToast(false)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ maxHeight: '140px', overflowY: 'auto', fontSize: '0.785rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span> 
            <span style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReminderEngine;
