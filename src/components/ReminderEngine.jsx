import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import { logSystemAction } from '../utils/logger';
import { Mail, CheckCircle2, AlertTriangle, Calendar, Bell, X } from 'lucide-react';

const ReminderEngine = () => {
  const { settings } = useSettings();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [hasUninvoicedAlerts, setHasUninvoicedAlerts] = useState(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState(null); // 'sent' | 'failed' | null
  const hasTriggeredRef = useRef(false);

  // Format local date YYYY-MM-DD to avoid UTC midnight timezone offset discrepancies in Indonesia (WIB/WITA/WIT)
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to verify if an automated reminder email has already been sent today
  // Checked via both localStorage (fast path) and Supabase audit logs (cross-device/cross-user guarantee)
  const checkHasSentToday = async (recipient, dateStr) => {
    if (!recipient) return false;
    const cleanRecipient = recipient.toLowerCase().trim();
    const sentKey = `travelops_reminders_sent_${cleanRecipient}_${dateStr}`;

    // 1. Instant check in browser localStorage
    const localVal = localStorage.getItem(sentKey);
    if (localVal === 'true' || localVal === 'sending') {
      return true;
    }

    // 2. Cross-device and cross-user check in Supabase travelops_logs
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('travelops_logs')
        .select('details, created_at')
        .eq('action', 'DAILY_REMINDERS_EMAIL_DISPATCH')
        .gte('created_at', startOfDay.toISOString());

      if (!error && Array.isArray(data) && data.length > 0) {
        const found = data.some(item => {
          const det = (item.details || '').toLowerCase();
          return det.includes(cleanRecipient) && det.includes(dateStr);
        });

        if (found) {
          localStorage.setItem(sentKey, 'true');
          return true;
        }
      }
    } catch (e) {
      console.warn('[ReminderEngine] Error querying remote dispatch logs:', e);
    }

    return false;
  };

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
    const uninvoicedIntervals = [30, 20, 15, 10]; // Days before departure for uninvoiced tours

    const milestoneItems = [];
    const uninvoicedItems = [];
    const logMessages = [];

    // Helper to extract customer/guest name details
    const getCustomerName = (item, type) => {
      if (type === 'Tour') {
        if (Array.isArray(item.paxInfo) && item.paxInfo.length > 0) {
          const names = item.paxInfo
            .map(p => {
              if (p.name && typeof p.name === 'string') return p.name.trim();
              const full = [p.title, p.firstName, p.lastName].filter(Boolean).join(' ').trim();
              return full || null;
            })
            .filter(Boolean);

          if (names.length === 1) return names[0];
          if (names.length > 1) return `${names[0]} (+${names.length - 1} pax)`;
        }
        return item.clientName || item.customerName || item.picName || item.internals?.clientName || '-';
      } else {
        // Cruise
        if (item.picName && item.picName.trim()) {
          const extraPax = (item.paxCount > 1) ? ` (+${item.paxCount - 1} pax)` : '';
          return `${item.picName.trim()}${extraPax}`;
        }
        if (Array.isArray(item.participants) && item.participants.length > 0) {
          const first = item.participants[0];
          const name = typeof first === 'string' ? first : (first.name || first.picName);
          if (name) {
            return `${name}${item.participants.length > 1 ? ` (+${item.participants.length - 1} pax)` : ''}`;
          }
        }
        return item.email || '-';
      }
    };

    // Helper to extract product details
    const getProductDetails = (item, type) => {
      if (type === 'Tour') {
        const dest = item.country || item.destination || '-';
        const cat = item.category ? `[${item.category}]` : '';
        const name = item.packageName || item.tourName || '';
        if (name && name !== dest) {
          return `${dest} • ${name} ${cat}`.trim();
        }
        return `${dest} ${cat}`.trim();
      } else {
        // Cruise
        const brand = item.cruiseBrand || 'Cruise';
        const ship = item.shipName || '';
        const route = item.route ? `(${item.route})` : '';
        return `${brand} - ${ship} ${route}`.trim();
      }
    };

    // Helper to extract handling staff name
    const getHandlingStaff = (item, type) => {
      if (type === 'Tour') {
        return item.staffName || item.internals?.staffName || item.tourLeader || item.internals?.tourLeader || 'Unassigned';
      } else {
        return item.staff || item.picName || 'Unassigned';
      }
    };

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

      const customerName = getCustomerName(item, type);
      const productDetails = getProductDetails(item, type);
      const handlingStaff = getHandlingStaff(item, type);
      const depositNumber = item.financials?.depositNumber || item.depositNumber || '';

      // 1. SPECIFIC RULE: Reminder for tours NOT yet invoiced in tempo 30, 20, 15, and 10 days before departure
      if (type === 'Tour' && diffDep !== null && uninvoicedIntervals.includes(diffDep)) {
        const hasInvoice = Boolean(item.financials?.invoiceNumber && item.financials.invoiceNumber.trim() !== '');
        if (!hasInvoice) {
          const urgencyLabel = diffDep === 10 
            ? '🚨 URGENT: Belum Di-Invoice (H-10)' 
            : diffDep === 15 
            ? '⚡ WARNING: Belum Di-Invoice (H-15)' 
            : diffDep === 20 
            ? '⚠️ PERHATIAN: Belum Di-Invoice (H-20)' 
            : '📋 NOTICE: Belum Di-Invoice (H-30)';

          const dpSnippet = depositNumber ? ` [DP: ${depositNumber}]` : '';
          const message = `⚠️ [INVOICE REMINDER] Tour ${code} (${destination}): Belum di-invoicing (${diffDep} hari lagi)${dpSnippet} • Cust: ${customerName} • PIC: ${handlingStaff}`;
          logMessages.push(message);

          uninvoicedItems.push({
            type: 'Tour',
            code,
            destination,
            productDetails,
            customerName,
            handlingStaff,
            depositNumber,
            departureDate,
            diff: diffDep,
            milestone: urgencyLabel,
            urgency: diffDep === 10 ? 'urgent' : diffDep === 15 ? 'warning' : diffDep === 20 ? 'attention' : 'notice',
            status,
            pax: item.paxCount || (item.paxInfo ? item.paxInfo.length : 1)
          });
        }
      }

      // 2. GENERAL RULE: Regular departure milestone intervals
      if (diffDep !== null && targetIntervals.includes(diffDep)) {
        const milestoneLabel = diffDep === 0 
          ? 'TODAY: Departure Day' 
          : `Departure in ${diffDep} day${diffDep > 1 ? 's' : ''} (H-${diffDep})`;

        const message = `${type} ${code} (${destination}): ${milestoneLabel} • Cust: ${customerName} • PIC: ${handlingStaff}`;
        logMessages.push(message);

        milestoneItems.push({
          type,
          code,
          destination,
          productDetails,
          customerName,
          handlingStaff,
          date: departureDate,
          diff: diffDep,
          milestone: milestoneLabel,
          status,
          pax: item.paxCount || (item.paxInfo ? item.paxInfo.length : 1)
        });
      }

      // 3. Return Day Milestone
      if (diffRet === 0) {
        const message = `TODAY: Return day for ${type} ${code} (${destination}) • Cust: ${customerName} • PIC: ${handlingStaff}`;
        logMessages.push(message);

        milestoneItems.push({
          type,
          code,
          destination,
          productDetails,
          customerName,
          handlingStaff,
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
    if (!targetRecipient) return;

    const cleanRecipient = targetRecipient.toLowerCase().trim();
    const todayStr = getLocalDateString(today);
    const sentKey = `travelops_reminders_sent_${cleanRecipient}_${todayStr}`;

    // Strictly ensure automated daily reminders are sent at most once per day across all users/browsers
    if (!isManual) {
      const alreadySent = await checkHasSentToday(cleanRecipient, todayStr);
      if (alreadySent) {
        console.log(`[ReminderEngine] Daily reminder email already dispatched today to ${cleanRecipient} (${todayStr}). Skipping.`);
        return;
      }
    }

    const totalAlerts = milestoneItems.length + uninvoicedItems.length;

    if (totalAlerts > 0) {
      setLogs(logMessages);
      setHasUninvoicedAlerts(uninvoicedItems.length > 0);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 9000);

      // In-flight concurrency lock to prevent simultaneous calls across tabs
      if (!isManual) {
        localStorage.setItem(sentKey, 'sending');
      }

      // Determine appropriate subject line
      const emailSubject = uninvoicedItems.length > 0
        ? `[ACTION REQUIRED] TravelOps: ${uninvoicedItems.length} Tour Belum Di-Invoicing (H-30/20/15/10) & Daily Digest`
        : `[TRAVELOPS] Daily Milestone Reminders (${milestoneItems.length} Due Today)`;

      // Construct clean HTML email
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
          
          <!-- Header Banner -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 26px;">✈️</span>
              <div>
                <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">TravelOps Operations</h2>
                <p style="margin: 0; font-size: 12px; color: #64748b;">Automated Daily Digest &amp; Milestone Reminders</p>
              </div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
              ${uninvoicedItems.length > 0 ? `
                <span style="background: #fee2e2; color: #b91c1c; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 6px; border: 1px solid #f87171;">
                  ⚠️ ${uninvoicedItems.length} Uninvoiced Tour${uninvoicedItems.length > 1 ? 's' : ''}
                </span>
              ` : ''}
              <span style="background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px;">
                ${milestoneItems.length} Departure/Return Milestone${milestoneItems.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <p style="font-size: 14px; color: #334155; margin-bottom: 18px; line-height: 1.5;">
            Halo Tim Operasional, sistem TravelOps mendeteksi status operasional dan jadwal penagihan untuk hari ini (<strong>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>):
          </p>

          <!-- 1. UNINVOICED TOURS ALERT SECTION (IF ANY) -->
          ${uninvoicedItems.length > 0 ? `
            <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px; padding: 16px; margin-bottom: 24px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #fda4af; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 20px;">🚨</span>
                  <div>
                    <h3 style="margin: 0; color: #9f1239; font-size: 15px; font-weight: 800;">
                      PERHATIAN: Tour Belum Di-Invoicing (Tempo H-30, H-20, H-15, H-10)
                    </h3>
                    <p style="margin: 0; font-size: 11.5px; color: #be123c;">
                      Tour berikut belum memiliki Nomor Invoice. Mohon PIC terkait segera menerbitkan invoice tagihan sebelum tanggal keberangkatan.
                    </p>
                  </div>
                </div>
                <span style="background: #e11d48; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">
                  ACTION NEEDED
                </span>
              </div>

              <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecdd3;">
                <thead>
                  <tr style="background: #ffe4e6; color: #881337; text-align: left;">
                    <th style="padding: 10px 8px; font-weight: 700;">Kode Tour</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Detail Produk</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Nama Pelanggan</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Staff Handling</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Tgl Berangkat &amp; Tempo</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  ${uninvoicedItems.map(item => `
                    <tr style="border-bottom: 1px solid #ffe4e6;">
                      <td style="padding: 10px 8px; font-weight: 700; color: #0f172a; font-family: monospace;">
                        ${item.code}
                        <div style="font-size: 11px; color: #64748b; font-family: sans-serif; font-weight: normal;">${item.pax} Pax</div>
                        ${item.depositNumber ? `<div style="font-size: 10.5px; color: #059669; font-weight: 700; margin-top: 2px;">DP: ${item.depositNumber}</div>` : ''}
                      </td>
                      <td style="padding: 10px 8px; color: #334155;">
                        <strong>${item.productDetails}</strong>
                      </td>
                      <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">
                        👤 ${item.customerName}
                      </td>
                      <td style="padding: 10px 8px; color: #0284c7; font-weight: 600;">
                        💼 ${item.handlingStaff}
                      </td>
                      <td style="padding: 10px 8px;">
                        <div style="font-family: monospace; color: #0284c7; font-weight: 700; margin-bottom: 4px;">${item.departureDate}</div>
                        <span style="
                          display: inline-block;
                          padding: 3px 8px;
                          border-radius: 4px;
                          font-weight: 800;
                          font-size: 10.5px;
                          ${item.diff === 10 ? 'background: #fee2e2; color: #991b1b; border: 1px solid #f87171;' : 
                            item.diff === 15 ? 'background: #ffedd5; color: #9a3412; border: 1px solid #fb923c;' : 
                            item.diff === 20 ? 'background: #fef3c7; color: #92400e; border: 1px solid #fcd34d;' : 
                            'background: #e0f2fe; color: #075985; border: 1px solid #7dd3fc;'}
                        ">
                          ${item.diff === 10 ? '🚨 H-10 (10 Hari Lagi)' : 
                            item.diff === 15 ? '⚡ H-15 (15 Hari Lagi)' : 
                            item.diff === 20 ? '⚠️ H-20 (20 Hari Lagi)' : 
                            '📋 H-30 (30 Hari Lagi)'}
                        </span>
                      </td>
                      <td style="padding: 10px 8px; color: #b91c1c; font-size: 11px; font-weight: 600;">
                        Segera proses invoice tagihan
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- 2. GENERAL OPERATIONAL MILESTONES -->
          ${milestoneItems.length > 0 ? `
            <div style="margin-bottom: 22px;">
              <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                <span>📅</span> Jadwal Keberangkatan &amp; Kepulangan Operasional
              </h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; text-align: left;">
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Tipe &amp; Kode</th>
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Detail Produk</th>
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Nama Pelanggan</th>
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Staff Handling</th>
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Tgl Target</th>
                    <th style="padding: 10px 8px; color: #475569; font-weight: 700;">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  ${milestoneItems.map(m => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">
                        <span style="font-size: 11px; color: #64748b; display: block;">${m.type}</span>
                        ${m.code}
                      </td>
                      <td style="padding: 10px 8px; color: #334155;">
                        <strong>${m.productDetails}</strong>
                        <div style="font-size: 11px; color: #64748b;">Pax: ${m.pax}</div>
                      </td>
                      <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">
                        👤 ${m.customerName}
                      </td>
                      <td style="padding: 10px 8px; color: #0284c7; font-weight: 600;">
                        💼 ${m.handlingStaff}
                      </td>
                      <td style="padding: 10px 8px; font-family: monospace; color: #0284c7; font-weight: 700;">${m.date}</td>
                      <td style="padding: 10px 8px;">
                        <span style="background: ${m.diff === 0 ? '#fee2e2' : m.diff <= 3 ? '#fef3c7' : '#ecfdf5'}; color: ${m.diff === 0 ? '#b91c1c' : m.diff <= 3 ? '#b45309' : '#047857'}; font-weight: 700; padding: 3px 8px; border-radius: 4px; font-size: 11px;">
                          ${m.milestone}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Footer Dispatch Info -->
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

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetRecipient,
            subject: emailSubject,
            text: `TravelOps Automated Reminders Notice\n\n${logMessages.map(l => `• ${l}`).join('\n')}\n\nRecipient: ${targetRecipient}`,
            html: emailHtml,
            category: isManual ? 'manual_reminder' : 'daily_reminder',
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
          localStorage.setItem(sentKey, 'true');

          // Log dispatch to Supabase audit log for cross-device idempotency tracking
          if (!data.skipped) {
            await logSystemAction(
              user,
              'DAILY_REMINDERS_EMAIL_DISPATCH',
              JSON.stringify({
                recipient: cleanRecipient,
                date: todayStr,
                count: milestoneItems.length,
                timestamp: new Date().toISOString()
              })
            );
          }

          if (isManual) {
            toast?.success(`Reminder email delivered to ${targetRecipient}!`);
          }
        } else {
          if (!isManual && localStorage.getItem(sentKey) === 'sending') {
            localStorage.removeItem(sentKey);
          }
          setEmailDeliveryStatus('failed');
          console.warn('[ReminderEngine] Email delivery failed:', data.error);
          if (isManual) {
            toast?.error(`Email dispatch failed: ${data.error || 'Check SMTP settings'}`);
          }
        }
      } catch (err) {
        if (!isManual && localStorage.getItem(sentKey) === 'sending') {
          localStorage.removeItem(sentKey);
        }
        setEmailDeliveryStatus('failed');
        console.error('[ReminderEngine] Network error sending reminder email:', err);
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
    if (authLoading || !user) return;
    if (!tours || tours.length === 0) return;
    if (hasTriggeredRef.current) return;

    const isEnabled = settings?.enableReminders !== false;
    if (!isEnabled) return;

    const todayStr = getLocalDateString();
    const targetRecipient = settings?.notificationEmail || user?.email || settings?.smtpUser;
    
    if (targetRecipient) {
      const cleanRecipient = targetRecipient.toLowerCase().trim();
      const sentKey = `travelops_reminders_sent_${cleanRecipient}_${todayStr}`;
      const localVal = localStorage.getItem(sentKey);
      if (localVal === 'true' || localVal === 'sending') return;

      hasTriggeredRef.current = true;

      // Double check Supabase remote logs asynchronously before calling runRemindersCheck
      checkHasSentToday(cleanRecipient, todayStr).then(alreadySent => {
        if (!alreadySent) {
          runRemindersCheck(false);
        }
      });
    }
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
        borderLeft: hasUninvoicedAlerts ? '4px solid #ef4444' : '4px solid var(--primary)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        maxWidth: '400px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '6px', 
            background: hasUninvoicedAlerts ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)', 
            color: hasUninvoicedAlerts ? '#ef4444' : 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {hasUninvoicedAlerts ? <AlertTriangle size={15} /> : <Bell size={15} />}
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '700' }}>
              {hasUninvoicedAlerts ? 'Invoicing & Operations Alert' : 'Operations Reminders'}
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

      <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.785rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {logs.map((log, i) => {
          const isWarning = log.includes('[INVOICE REMINDER]');
          return (
            <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
              <span style={{ color: isWarning ? '#ef4444' : 'var(--success)', fontWeight: 'bold' }}>
                {isWarning ? '⚠️' : '✓'}
              </span> 
              <span style={{ color: isWarning ? '#fca5a5' : 'var(--text-main)', lineHeight: '1.4' }}>{log}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReminderEngine;
