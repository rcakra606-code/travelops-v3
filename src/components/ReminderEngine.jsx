import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useTours } from '../context/TourContext';
import { useCruises } from '../context/CruiseContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../supabaseClient';
import { logSystemAction } from '../utils/logger';
import { Mail, CheckCircle2, AlertTriangle, Calendar, Bell, X, FileText, CheckSquare, Layers } from 'lucide-react';

const ReminderEngine = () => {
  const { settings } = useSettings();
  const { tours } = useTours();
  const { cruises } = useCruises();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [logs, setLogs] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [alertSummary, setAlertSummary] = useState({ operational: 0, admin: 0, mdr: 0, invoice: 0 });
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState(null); // 'sent' | 'failed' | null
  const hasTriggeredRef = useRef(false);

  // Format local date YYYY-MM-DD to avoid UTC midnight timezone offset discrepancies in Indonesia (WIB/WITA/WIT)
  const getLocalDateString = (d = new Date()) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to verify if an automated reminder email for a specific category has already been sent today
  // Checked via both localStorage (fast path) and Supabase audit logs (cross-device/cross-user guarantee)
  const checkHasSentCategoryToday = async (category, recipient, dateStr) => {
    if (!recipient) return false;
    const cleanRecipient = recipient.toLowerCase().trim();
    const sentKey = `travelops_reminders_${category}_sent_${cleanRecipient}_${dateStr}`;

    // 1. Instant check in browser localStorage
    const localVal = localStorage.getItem(sentKey);
    if (localVal === 'true' || localVal === 'sending') {
      return true;
    }

    // 2. Cross-device and cross-user check in Supabase travelops_logs
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const targetAction = category === 'operational' 
        ? 'DAILY_OPERATIONAL_EMAIL_DISPATCH' 
        : 'DAILY_ADMIN_EMAIL_DISPATCH';

      const { data, error } = await supabase
        .from('travelops_logs')
        .select('details, created_at')
        .eq('action', targetAction)
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
      console.warn(`[ReminderEngine] Error querying remote dispatch logs for ${category}:`, e);
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

    const targetOperationalIntervals = [30, 15, 7, 5, 3, 2, 1, 0]; // 0 is departure / sailing day

    const operationalItems = [];
    const uninvoicedItems = [];
    const unclaimedMdrItems = [];
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

      // Skip cancelled or already archived past tours from operational reminders
      if (['Cancel', 'Cancelled'].includes(status)) return;

      const customerName = getCustomerName(item, type);
      const productDetails = getProductDetails(item, type);
      const handlingStaff = getHandlingStaff(item, type);
      const depositNumber = item.financials?.depositNumber || item.depositNumber || '';

      // =========================================================================
      // EMAIL 1: JALUR OPERASIONAL (TOUR & CRUISE DEPARTURE & RETURN MILESTONES)
      // =========================================================================
      if (status !== 'Past Date') {
        if (diffDep !== null && targetOperationalIntervals.includes(diffDep)) {
          const milestoneLabel = diffDep === 0 
            ? 'HARI INI: Keberangkatan Tour/Cruise (Departure Day)' 
            : `Keberangkatan dalam ${diffDep} hari lagi (H-${diffDep})`;

          const message = `✈️ [OPERASIONAL] ${type} ${code} (${destination}): ${milestoneLabel} • Tamu: ${customerName} • PIC: ${handlingStaff}`;
          logMessages.push(message);

          operationalItems.push({
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

        // Return Day Milestone
        if (diffRet === 0) {
          const message = `🏁 [OPERASIONAL] HARI INI: Kepulangan ${type} ${code} (${destination}) • Tamu: ${customerName} • PIC: ${handlingStaff}`;
          logMessages.push(message);

          operationalItems.push({
            type,
            code,
            destination,
            productDetails,
            customerName,
            handlingStaff,
            date: returnDate,
            diff: 0,
            milestone: 'HARI INI: Kepulangan (Return Day)',
            status,
            pax: item.paxCount || 1
          });
        }
      }

      // =========================================================================
      // EMAIL 2: JALUR ADMINISTRASI (INVOICE & FORM CLAIM MDR TOUR)
      // =========================================================================
      if (type === 'Tour') {
        // 2A. Reminder Form Claim MDR Belum Dicentang
        const isClaimMdr = Boolean(item.claimMdr || item.claim_mdr || item.internals?.claimMdr);
        if (!isClaimMdr) {
          // Trigger reminder for upcoming tours within 30 days, ongoing tours, or tours returned in last 14 days
          const isUpcoming30 = diffDep !== null && diffDep >= 0 && diffDep <= 30;
          const isOngoingOrRecentReturn = diffDep !== null && diffDep < 0 && (diffRet === null || diffRet >= -14);

          if (isUpcoming30 || isOngoingOrRecentReturn) {
            let urgencyLabel = 'Form Claim MDR Belum Dicentang';
            let urgencyLevel = 'notice';

            if (isOngoingOrRecentReturn || diffDep === 0) {
              urgencyLabel = '🚨 MENDESAK: Tour Selesai/Berjalan (Form Claim MDR Belum Dicentang)';
              urgencyLevel = 'urgent';
            } else if (diffDep <= 7) {
              urgencyLabel = `🚨 URGENT: H-${diffDep} Berangkat (Form Claim MDR Belum Dicentang)`;
              urgencyLevel = 'urgent';
            } else if (diffDep <= 15) {
              urgencyLabel = `⚡ WARNING: H-${diffDep} Berangkat (Form Claim MDR Belum Dicentang)`;
              urgencyLevel = 'warning';
            } else {
              urgencyLabel = `📋 NOTICE: H-${diffDep} Berangkat (Form Claim MDR Belum Dicentang)`;
              urgencyLevel = 'notice';
            }

            const message = `📋 [ADMIN: CLAIM MDR] Tour ${code} (${destination}): ${urgencyLabel} • PIC: ${handlingStaff}`;
            logMessages.push(message);

            unclaimedMdrItems.push({
              type: 'Tour',
              code,
              destination,
              productDetails,
              customerName,
              handlingStaff,
              depositNumber,
              departureDate,
              returnDate,
              diff: diffDep,
              milestone: urgencyLabel,
              urgency: urgencyLevel,
              status,
              pax: item.paxCount || (item.paxInfo ? item.paxInfo.length : 1)
            });
          }
        }

        // 2B. Reminder Tour Belum Di-Invoice (H-30 s/d H-0)
        const hasInvoice = Boolean(
          (item.financials?.invoiceNumber && item.financials.invoiceNumber.trim() !== '') ||
          (item.invoiceNumber && item.invoiceNumber.trim() !== '')
        );

        if (!hasInvoice && diffDep !== null && diffDep >= 0 && diffDep <= 30) {
          const urgencyLabel = diffDep <= 7 
            ? `🚨 URGENT: Belum Di-Invoice (H-${diffDep})` 
            : diffDep <= 15 
            ? `⚡ WARNING: Belum Di-Invoice (H-${diffDep})` 
            : `📋 NOTICE: Belum Di-Invoice (H-${diffDep})`;

          const dpSnippet = depositNumber ? ` [DP: ${depositNumber}]` : '';
          const message = `🧾 [ADMIN: INVOICE] Tour ${code} (${destination}): Belum di-invoicing (${diffDep} hari lagi)${dpSnippet} • PIC: ${handlingStaff}`;
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
            urgency: diffDep <= 7 ? 'urgent' : diffDep <= 15 ? 'warning' : 'notice',
            status,
            pax: item.paxCount || (item.paxInfo ? item.paxInfo.length : 1)
          });
        }
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

    setAlertSummary({
      operational: operationalItems.length,
      admin: unclaimedMdrItems.length + uninvoicedItems.length,
      mdr: unclaimedMdrItems.length,
      invoice: uninvoicedItems.length
    });

    const totalAlerts = operationalItems.length + unclaimedMdrItems.length + uninvoicedItems.length;

    if (totalAlerts > 0) {
      setLogs(logMessages);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 10000);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const smtpConfig = (userEmail && userPass) ? {
        host,
        port,
        user: userEmail,
        pass: userPass,
        senderName
      } : undefined;

      // =========================================================================
      // 1. DISPATCH EMAIL 1: REMINDER OPERASIONAL TOUR & CRUISE
      // =========================================================================
      if (operationalItems.length > 0) {
        const opSentKey = `travelops_reminders_operational_sent_${cleanRecipient}_${todayStr}`;
        const alreadySentOp = !isManual && await checkHasSentCategoryToday('operational', cleanRecipient, todayStr);

        if (!alreadySentOp) {
          if (!isManual) localStorage.setItem(opSentKey, 'sending');

          const opEmailSubject = `[OPERASIONAL] Jadwal Keberangkatan & Kepulangan Tour & Cruise (${operationalItems.length} Agenda Hari Ini) - TravelOps`;
          const opEmailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; color: #1e293b;">
              
              <!-- Header Banner -->
              <div style="border-bottom: 2px solid #0284c7; padding-bottom: 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 28px;">✈️</span>
                  <div>
                    <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 800;">TravelOps Operasional</h2>
                    <p style="margin: 0; font-size: 12px; color: #0284c7; font-weight: 600;">Jadwal Keberangkatan &amp; Kepulangan Tour / Cruise</p>
                  </div>
                </div>
                <div style="text-align: right;">
                  <span style="background: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
                    ${operationalItems.length} Agenda Operasional
                  </span>
                </div>
              </div>

              <p style="font-size: 13.5px; color: #334155; margin-bottom: 18px; line-height: 1.5;">
                Halo Tim Operasional, berikut ringkasan milestone keberangkatan dan kepulangan tour &amp; cruise per <strong>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>:
              </p>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background: #f0f9ff; border-bottom: 1px solid #bae6fd; text-align: left; color: #0369a1;">
                    <th style="padding: 10px 8px; font-weight: 700;">Tipe &amp; Kode</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Detail Produk</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Nama Tamu</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Staff Handling</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Tgl Target</th>
                    <th style="padding: 10px 8px; font-weight: 700;">Milestone</th>
                  </tr>
                </thead>
                <tbody>
                  ${operationalItems.map(m => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 10px 8px; font-weight: 700; color: #0f172a;">
                        <span style="font-size: 10.5px; color: #64748b; display: block;">${m.type}</span>
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

              <!-- Footer -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 11.5px; color: #64748b;">
                  Penerima: <strong>${targetRecipient}</strong> • Jalur: <strong>Email 1 - Operasional Tour &amp; Cruise</strong>
                </p>
              </div>

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                TravelOps Operations Suite • Automated Daily Dispatcher
              </p>
            </div>
          `;

          try {
            const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                to: targetRecipient,
                subject: opEmailSubject,
                text: `TravelOps Daily Operational Digest\n\n${operationalItems.map(m => `• ${m.type} ${m.code}: ${m.milestone} (${m.date}) - PIC: ${m.handlingStaff}`).join('\n')}`,
                html: opEmailHtml,
                category: isManual ? 'manual_reminder' : 'daily_operational_reminder',
                smtpConfig
              })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              localStorage.setItem(opSentKey, 'true');
              await logSystemAction(
                user,
                'DAILY_OPERATIONAL_EMAIL_DISPATCH',
                JSON.stringify({ recipient: cleanRecipient, date: todayStr, count: operationalItems.length, timestamp: new Date().toISOString() })
              );
            } else {
              localStorage.removeItem(opSentKey);
            }
          } catch (err) {
            localStorage.removeItem(opSentKey);
            console.error('[ReminderEngine] Error dispatching operational email:', err);
          }
        }
      }

      // =========================================================================
      // 2. DISPATCH EMAIL 2: REMINDER ADMINISTRASI (INVOICE & FORM CLAIM MDR)
      // =========================================================================
      if (unclaimedMdrItems.length > 0 || uninvoicedItems.length > 0) {
        const adminSentKey = `travelops_reminders_admin_sent_${cleanRecipient}_${todayStr}`;
        const alreadySentAdmin = !isManual && await checkHasSentCategoryToday('admin', cleanRecipient, todayStr);

        if (!alreadySentAdmin) {
          if (!isManual) localStorage.setItem(adminSentKey, 'sending');

          const adminSubjectParts = [];
          if (unclaimedMdrItems.length > 0) adminSubjectParts.push(`${unclaimedMdrItems.length} Form Claim MDR Belum Dicentang`);
          if (uninvoicedItems.length > 0) adminSubjectParts.push(`${uninvoicedItems.length} Tour Belum Di-Invoice`);

          const adminEmailSubject = `[ADMINISTRASI] Peringatan: ${adminSubjectParts.join(' & ')} - TravelOps`;

          const adminEmailHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1.5px solid #fda4af; border-radius: 12px; color: #1e293b;">
              
              <!-- Header Banner -->
              <div style="border-bottom: 2px solid #e11d48; padding-bottom: 14px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 28px;">🧾</span>
                  <div>
                    <h2 style="margin: 0; color: #9f1239; font-size: 20px; font-weight: 800;">TravelOps Administrasi &amp; Keuangan</h2>
                    <p style="margin: 0; font-size: 12px; color: #e11d48; font-weight: 700;">Peringatan Pending: Form Claim MDR &amp; Penerbitan Invoice Tour</p>
                  </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                  ${unclaimedMdrItems.length > 0 ? `
                    <span style="background: #ffe4e6; color: #be123c; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #fecdd3;">
                      📋 ${unclaimedMdrItems.length} Form Claim MDR Pending
                    </span>
                  ` : ''}
                  ${uninvoicedItems.length > 0 ? `
                    <span style="background: #fef2f2; color: #991b1b; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; border: 1px solid #f87171;">
                      ⚠️ ${uninvoicedItems.length} Tour Belum Di-Invoice
                    </span>
                  ` : ''}
                </div>
              </div>

              <p style="font-size: 13.5px; color: #334155; margin-bottom: 18px; line-height: 1.5;">
                Halo Tim Administrasi &amp; Tour Operations, sistem TravelOps mendeteksi data administrasi tour yang <strong>memerlukan tindakan segera</strong> per <strong>${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>:
              </p>

              <!-- SUB-SECTION 1: FORM CLAIM MDR BELUM DICENTANG -->
              ${unclaimedMdrItems.length > 0 ? `
                <div style="background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 10px; padding: 16px; margin-bottom: 22px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #fda4af; padding-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">📋</span>
                      <div>
                        <h3 style="margin: 0; color: #9f1239; font-size: 15px; font-weight: 800;">
                          1. Form Claim MDR Tour Belum Dicentang (${unclaimedMdrItems.length} Tour)
                        </h3>
                        <p style="margin: 0; font-size: 11.5px; color: #be123c;">
                          Tour berikut belum memiliki checklist Form Claim MDR. Mohon PIC segera memverifikasi berkas dan mencentang checkbox pada modul Tour.
                        </p>
                      </div>
                    </div>
                    <span style="background: #e11d48; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">
                      MDR ACTION
                    </span>
                  </div>

                  <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fecdd3;">
                    <thead>
                      <tr style="background: #ffe4e6; color: #881337; text-align: left;">
                        <th style="padding: 10px 8px; font-weight: 700;">Kode Tour</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Destinasi &amp; Produk</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Nama Tamu</th>
                        <th style="padding: 10px 8px; font-weight: 700;">PIC Staff</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Tgl Berangkat</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Status Claim MDR</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${unclaimedMdrItems.map(item => `
                        <tr style="border-bottom: 1px solid #ffe4e6;">
                          <td style="padding: 10px 8px; font-weight: 700; color: #0f172a; font-family: monospace;">
                            ${item.code}
                            <div style="font-size: 10.5px; color: #64748b; font-family: sans-serif; font-weight: normal;">${item.pax} Pax</div>
                          </td>
                          <td style="padding: 10px 8px; color: #334155;">
                            <strong>${item.destination}</strong>
                            <div style="font-size: 11px; color: #64748b;">${item.productDetails}</div>
                          </td>
                          <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">
                            👤 ${item.customerName}
                          </td>
                          <td style="padding: 10px 8px; color: #0284c7; font-weight: 600;">
                            💼 ${item.handlingStaff}
                          </td>
                          <td style="padding: 10px 8px; font-family: monospace; color: #0f172a;">
                            ${item.departureDate}
                          </td>
                          <td style="padding: 10px 8px;">
                            <span style="background: #fee2e2; color: #991b1b; font-weight: 800; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; border: 1px solid #f87171; display: inline-block;">
                              ❌ Belum Dicentang
                            </span>
                            <div style="font-size: 10px; color: #b91c1c; margin-top: 3px;">${item.milestone}</div>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <!-- SUB-SECTION 2: TOUR BELUM DI-INVOICE -->
              ${uninvoicedItems.length > 0 ? `
                <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 10px; padding: 16px; margin-bottom: 22px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #fcd34d; padding-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 20px;">🧾</span>
                      <div>
                        <h3 style="margin: 0; color: #92400e; font-size: 15px; font-weight: 800;">
                          2. Tour Belum Memiliki Nomor Invoice (${uninvoicedItems.length} Tour)
                        </h3>
                        <p style="margin: 0; font-size: 11.5px; color: #b45309;">
                          Tour berikut belum memiliki Nomor Invoice (tempo H-30 s/d H-0). Mohon segera input Nomor Invoice pada modul Tour.
                        </p>
                      </div>
                    </div>
                    <span style="background: #d97706; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">
                      INVOICE NEEDED
                    </span>
                  </div>

                  <table style="width: 100%; border-collapse: collapse; font-size: 12px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #fde68a;">
                    <thead>
                      <tr style="background: #fef3c7; color: #78350f; text-align: left;">
                        <th style="padding: 10px 8px; font-weight: 700;">Kode Tour</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Destinasi &amp; Produk</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Nama Tamu</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Staff Handling</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Tgl Berangkat &amp; Tempo</th>
                        <th style="padding: 10px 8px; font-weight: 700;">Status Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${uninvoicedItems.map(item => `
                        <tr style="border-bottom: 1px solid #fef3c7;">
                          <td style="padding: 10px 8px; font-weight: 700; color: #0f172a; font-family: monospace;">
                            ${item.code}
                            ${item.depositNumber ? `<div style="font-size: 10.5px; color: #059669; font-weight: 700; margin-top: 2px;">DP: ${item.depositNumber}</div>` : ''}
                          </td>
                          <td style="padding: 10px 8px; color: #334155;">
                            <strong>${item.destination}</strong>
                            <div style="font-size: 11px; color: #64748b;">${item.productDetails}</div>
                          </td>
                          <td style="padding: 10px 8px; color: #0f172a; font-weight: 600;">
                            👤 ${item.customerName}
                          </td>
                          <td style="padding: 10px 8px; color: #0284c7; font-weight: 600;">
                            💼 ${item.handlingStaff}
                          </td>
                          <td style="padding: 10px 8px;">
                            <div style="font-family: monospace; color: #0284c7; font-weight: 700;">${item.departureDate}</div>
                            <span style="font-size: 10.5px; color: #b45309; font-weight: 700;">${item.milestone}</span>
                          </td>
                          <td style="padding: 10px 8px;">
                            <span style="background: #fee2e2; color: #991b1b; font-weight: 800; padding: 3px 8px; border-radius: 4px; font-size: 10.5px; border: 1px solid #f87171;">
                              Belum Terinput
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              <!-- Instructions / Direct Action Tip -->
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 11.5px; color: #64748b;">
                  Penerima: <strong>${targetRecipient}</strong> • Jalur: <strong>Email 2 - Administrasi (Invoice &amp; Form Claim MDR)</strong>
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11.5px; color: #334155;">
                  💡 <em>Tips: Buka halaman Tours Manager di web TravelOps untuk melakukan checklist Form Claim MDR atau input Nomor Invoice secara langsung.</em>
                </p>
              </div>

              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                TravelOps Administration Suite • Automated Daily Dispatcher
              </p>
            </div>
          `;

          try {
            const res = await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                to: targetRecipient,
                subject: adminEmailSubject,
                text: `TravelOps Administrative Reminders\n\nForm Claim MDR Pending: ${unclaimedMdrItems.length}\nUninvoiced Tours: ${uninvoicedItems.length}`,
                html: adminEmailHtml,
                category: isManual ? 'manual_reminder' : 'daily_admin_reminder',
                smtpConfig
              })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
              localStorage.setItem(adminSentKey, 'true');
              await logSystemAction(
                user,
                'DAILY_ADMIN_EMAIL_DISPATCH',
                JSON.stringify({ 
                  recipient: cleanRecipient, 
                  date: todayStr, 
                  totalCount: unclaimedMdrItems.length + uninvoicedItems.length,
                  mdrCount: unclaimedMdrItems.length,
                  invoiceCount: uninvoicedItems.length,
                  timestamp: new Date().toISOString() 
                })
              );
            } else {
              localStorage.removeItem(adminSentKey);
            }
          } catch (err) {
            localStorage.removeItem(adminSentKey);
            console.error('[ReminderEngine] Error dispatching admin email:', err);
          }
        }
      }

      setEmailDeliveryStatus('sent');
      if (isManual) {
        toast?.success(`2 Jalur Reminder (Operasional & Administrasi) berhasil dicek dan dikirim ke ${targetRecipient}!`);
      }

    } else if (isManual) {
      setLogs(['Semua tour dan cruise telah diperiksa. Tidak ada pending administrasi (Invoice & Claim MDR) maupun agenda keberangkatan hari ini!']);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
      toast?.info('Pemeriksaan selesai: Seluruh administrasi lengkap dan tidak ada jadwal mendesak hari ini.');
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
      const opKey = `travelops_reminders_operational_sent_${cleanRecipient}_${todayStr}`;
      const adminKey = `travelops_reminders_admin_sent_${cleanRecipient}_${todayStr}`;

      const opDone = localStorage.getItem(opKey) === 'true';
      const adminDone = localStorage.getItem(adminKey) === 'true';

      if (opDone && adminDone) return;

      hasTriggeredRef.current = true;
      runRemindersCheck(false);
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
  const hasAdminAlerts = alertSummary.admin > 0;

  return (
    <div 
      className="card fade-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderLeft: hasAdminAlerts ? '4px solid #ef4444' : '4px solid var(--primary)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        maxWidth: '430px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ 
            width: '28px', height: '28px', borderRadius: '6px', 
            background: hasAdminAlerts ? 'rgba(239, 68, 68, 0.15)' : 'rgba(6, 182, 212, 0.15)', 
            color: hasAdminAlerts ? '#ef4444' : 'var(--primary)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {hasAdminAlerts ? <AlertTriangle size={15} /> : <Bell size={15} />}
          </div>
          <div>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '700' }}>
              {alertSummary.admin > 0 && alertSummary.operational > 0
                ? 'Operasional & Administrasi Digest'
                : alertSummary.admin > 0
                ? 'Administrasi Alert (Invoice & Claim MDR)'
                : 'Operasional Tour & Cruise Reminders'}
            </h4>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-subtle)' }}>
              2 Jalur Email: {targetRecipient}
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

      <div style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '0.785rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        {logs.map((log, i) => {
          const isMdr = log.includes('[ADMIN: CLAIM MDR]');
          const isInvoice = log.includes('[ADMIN: INVOICE]');
          const isOp = log.includes('[OPERASIONAL]');

          return (
            <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
              <span style={{ 
                color: isMdr ? '#f43f5e' : isInvoice ? '#fbbf24' : 'var(--primary)', 
                fontWeight: 'bold' 
              }}>
                {isMdr ? '📋' : isInvoice ? '🧾' : '✈️'}
              </span> 
              <span style={{ 
                color: isMdr ? '#fda4af' : isInvoice ? '#fef08a' : 'var(--text-main)', 
                lineHeight: '1.4' 
              }}>
                {log}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReminderEngine;
