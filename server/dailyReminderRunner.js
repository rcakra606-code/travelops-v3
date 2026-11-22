import {
  buildOperationalEmailHtml,
  buildAdminEmailHtml,
  buildDocumentEmailHtml
} from '../src/utils/emailTemplateBuilder.js';
import { dispatchTransactionalEmail, getLocalDateStr } from './mailer.js';
import { logger } from './logger.js';

const OPERATIONAL_INTERVALS = new Set([30, 15, 7, 5, 3, 2, 1, 0]);

function diffDaysFromLocalToday(targetDateStr, todayDate) {
  if (!targetDateStr) return null;
  const clean = String(targetDateStr).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return null;
  const target = new Date(`${clean}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return null;
  return Math.round((target - todayDate) / (1000 * 60 * 60 * 24));
}

function getTourCustomerName(t) {
  const pax = Array.isArray(t.pax_info) ? t.pax_info : [];
  const names = pax
    .map((p) => {
      if (p?.name && typeof p.name === 'string') return p.name.trim();
      return [p?.title, p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || null;
    })
    .filter(Boolean);
  if (names.length === 1) return names[0];
  if (names.length > 1) return `${names[0]} (+${names.length - 1} pax)`;
  return t.internals?.clientName || '-';
}

/**
 * Executes the 3-channel Daily Reminders scan (Operational, Admin, Document/Visa)
 * directly on the backend so alerts fire 24/7 even when no browser tab is open.
 */
export async function runServerDailyReminders({ supabaseAdmin, overrideRecipient = '' }) {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side daily reminders.');
  }

  const todayStr = getLocalDateStr();
  const todayUtc = new Date(`${todayStr}T00:00:00Z`);

  const [settingsRes, toursRes, cruisesRes, docsRes] = await Promise.all([
    supabaseAdmin
      .from('travelops_settings')
      .select('setting_value')
      .eq('setting_key', 'global_preferences')
      .maybeSingle(),
    supabaseAdmin.from('travelops_tours').select('*'),
    supabaseAdmin.from('travelops_cruises').select('*'),
    supabaseAdmin.from('travelops_documents').select('*')
  ]);

  const settings = settingsRes.data?.setting_value || {};
  if (settings.enableReminders === false && !overrideRecipient) {
    return { success: true, skipped: true, reason: 'Reminders disabled in global settings.' };
  }

  const targetRecipient = (
    overrideRecipient ||
    settings.notificationEmail ||
    process.env.REMINDER_RECIPIENT_EMAIL ||
    settings.smtpUser ||
    process.env.SMTP_USER ||
    ''
  ).trim();

  if (!targetRecipient) {
    return { success: true, skipped: true, reason: 'No notification recipient email configured.' };
  }

  const smtpConfig = settings.smtpUser && settings.smtpPass
    ? {
        host: settings.smtpHost,
        port: settings.smtpPort,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        senderName: settings.smtpSenderName
      }
    : undefined;

  const appUrl = process.env.APP_URL || '';
  const operationalItems = [];
  const unclaimedMdrItems = [];
  const uninvoicedItems = [];
  const appointmentDocItems = [];
  const pendingDocItems = [];

  for (const t of toursRes.data || []) {
    const status = t.status || 'Pending';
    if (['Cancel', 'Cancelled', 'Canceled'].includes(status)) continue;

    const code = t.internals?.tourCode || t.internals?.bookingCode || `Tour #${t.id}`;
    const customerName = getTourCustomerName(t);
    const staff = t.internals?.staffName || t.internals?.tourLeader || 'Unassigned';
    const diffDep = diffDaysFromLocalToday(t.departure_date, todayUtc);
    const diffRet = diffDaysFromLocalToday(t.return_date, todayUtc);

    if (status !== 'Past Date') {
      if (diffDep !== null && OPERATIONAL_INTERVALS.has(diffDep)) {
        operationalItems.push({
          type: 'Tour',
          code,
          destination: t.country || '-',
          productDetails: `${t.country || '-'} ${t.category ? `[${t.category}]` : ''}`.trim(),
          customerName,
          handlingStaff: staff,
          date: t.departure_date,
          diff: diffDep,
          milestone:
            diffDep === 0
              ? 'HARI INI: Keberangkatan Tour/Cruise (Departure Day)'
              : `Keberangkatan dalam ${diffDep} hari lagi (H-${diffDep})`,
          status,
          pax: t.internals?.paxCount || (Array.isArray(t.pax_info) ? t.pax_info.length : 1) || 1
        });
      }

      if (diffRet === 0) {
        operationalItems.push({
          type: 'Tour',
          code,
          destination: t.country || '-',
          productDetails: `${t.country || '-'} ${t.category ? `[${t.category}]` : ''}`.trim(),
          customerName,
          handlingStaff: staff,
          date: t.return_date,
          diff: 0,
          milestone: 'HARI INI: Kepulangan (Return Day)',
          status,
          pax: t.internals?.paxCount || 1
        });
      }
    }

    const fin = t.financials || {};
    const depositNumber = String(fin.depositNumber || t.internals?.depositNumber || '').trim();
    const invoiceNumber = String(fin.invoiceNumber || '').trim();
    const claimMdr = Boolean(t.claim_mdr ?? t.internals?.claimMdr);

    if (depositNumber && !claimMdr) {
      unclaimedMdrItems.push({
        type: 'Tour',
        code,
        customerName,
        destination: t.country || '-',
        handlingStaff: staff,
        depositNumber,
        departureDate: t.departure_date || '-',
        diff: diffDep,
        status
      });
    }

    if (depositNumber && !invoiceNumber) {
      uninvoicedItems.push({
        type: 'Tour',
        code,
        customerName,
        destination: t.country || '-',
        handlingStaff: staff,
        depositNumber,
        departureDate: t.departure_date || '-',
        diff: diffDep,
        status
      });
    }
  }

  for (const c of cruisesRes.data || []) {
    const status = c.status || 'Upcoming';
    if (['Cancel', 'Cancelled', 'Canceled', 'Past Date'].includes(status)) continue;

    const diffDep = diffDaysFromLocalToday(c.sailing_start, todayUtc);
    const diffRet = diffDaysFromLocalToday(c.sailing_end, todayUtc);
    const code = c.booking_ref || `Cruise #${c.id}`;
    const customerName = c.pic_name || c.email || '-';
    const staff = c.staff || 'Unassigned';

    if (diffDep !== null && OPERATIONAL_INTERVALS.has(diffDep)) {
      operationalItems.push({
        type: 'Cruise',
        code,
        destination: c.route || '-',
        productDetails: `${c.cruise_brand || 'Cruise'} - ${c.ship_name || ''}`.trim(),
        customerName,
        handlingStaff: staff,
        date: c.sailing_start,
        diff: diffDep,
        milestone:
          diffDep === 0
            ? 'HARI INI: Keberangkatan Tour/Cruise (Departure Day)'
            : `Keberangkatan dalam ${diffDep} hari lagi (H-${diffDep})`,
        status,
        pax: Number(c.pax_count) || 1
      });
    }

    if (diffRet === 0) {
      operationalItems.push({
        type: 'Cruise',
        code,
        destination: c.route || '-',
        productDetails: `${c.cruise_brand || 'Cruise'} - ${c.ship_name || ''}`.trim(),
        customerName,
        handlingStaff: staff,
        date: c.sailing_end,
        diff: 0,
        milestone: 'HARI INI: Kepulangan (Return Day)',
        status,
        pax: Number(c.pax_count) || 1
      });
    }
  }

  for (const d of docsRes.data || []) {
    const shippingStatus = d.shipping_status || 'Processing';
    const isCompleted = shippingStatus === 'Received' || d.received_status === 'Final';
    if (isCompleted) continue;

    const diffAppt = diffDaysFromLocalToday(d.appointment_date, todayUtc);
    if (diffAppt !== null && diffAppt >= 0 && diffAppt <= 7) {
      appointmentDocItems.push({
        guestName: d.guest_name || '-',
        phoneNumber: d.phone_number || '-',
        bookingRef: d.booking_code || d.invoice_number || '-',
        country: d.country || '-',
        docType: d.doc_type || 'Visa / Passport',
        processType: d.process_type || 'Normal',
        appointmentDate: d.appointment_date,
        appointmentTime: d.appointment_time || '-',
        appointmentLocation: d.appointment_location || '-',
        staff: d.staff || 'Unassigned',
        diff: diffAppt,
        urgencyLabel: diffAppt === 0 ? 'HARI INI' : `H-${diffAppt}`
      });
    }

    const diffEst = diffDaysFromLocalToday(d.estimated_done, todayUtc);
    if (diffEst === null || diffEst <= 3) {
      pendingDocItems.push({
        guestName: d.guest_name || '-',
        phoneNumber: d.phone_number || '-',
        bookingRef: d.booking_code || d.invoice_number || '-',
        country: d.country || '-',
        docType: d.doc_type || 'Visa / Passport',
        processType: d.process_type || 'Normal',
        receiveDate: d.receive_date || '-',
        estimatedDone: d.estimated_done || '',
        shippingStatus,
        staff: d.staff || 'Unassigned',
        statusLabel:
          diffEst === null
            ? 'Estimasi Belum Diisi'
            : diffEst < 0
              ? `Terlambat ${Math.abs(diffEst)} Hari`
              : diffEst === 0
                ? 'Jatuh Tempo Hari Ini'
                : `Jatuh Tempo H-${diffEst}`
      });
    }
  }

  const results = {};

  if (operationalItems.length > 0) {
    const html = buildOperationalEmailHtml({ operationalItems, targetRecipient, appUrl });
    results.operational = await dispatchTransactionalEmail({
      to: targetRecipient,
      subject: `[TravelOps Operasional] ${operationalItems.length} Jadwal Keberangkatan/Kepulangan (${todayStr})`,
      text: `Terdapat ${operationalItems.length} item operasional Tour & Cruise yang memerlukan perhatian pada ${todayStr}.`,
      html,
      smtpConfig,
      category: 'daily_operational_reminder',
      supabaseAdmin
    });
  }

  if (unclaimedMdrItems.length > 0 || uninvoicedItems.length > 0) {
    const html = buildAdminEmailHtml({
      unclaimedMdrItems,
      uninvoicedItems,
      targetRecipient,
      appUrl
    });
    results.admin = await dispatchTransactionalEmail({
      to: targetRecipient,
      subject: `[TravelOps Admin] ${unclaimedMdrItems.length} MDR & ${uninvoicedItems.length} Belum Invoice (${todayStr})`,
      text: `Reminder Administrasi: ${unclaimedMdrItems.length} Claim MDR belum divalidasi, ${uninvoicedItems.length} DP belum terbit invoice.`,
      html,
      smtpConfig,
      category: 'daily_admin_reminder',
      supabaseAdmin
    });
  }

  if (appointmentDocItems.length > 0 || pendingDocItems.length > 0) {
    const html = buildDocumentEmailHtml({
      appointmentDocItems,
      pendingDocItems,
      targetRecipient,
      appUrl
    });
    results.document = await dispatchTransactionalEmail({
      to: targetRecipient,
      subject: `[TravelOps Dokumen/Visa] ${appointmentDocItems.length} Appointment & ${pendingDocItems.length} Dokumen Pending (${todayStr})`,
      text: `Reminder Dokumen & Visa: ${appointmentDocItems.length} jadwal appointment dekat dan ${pendingDocItems.length} dokumen perlu follow-up.`,
      html,
      smtpConfig,
      category: 'daily_document_reminder',
      supabaseAdmin
    });
  }

  logger.info(
    {
      date: todayStr,
      recipient: targetRecipient,
      counts: {
        operational: operationalItems.length,
        mdr: unclaimedMdrItems.length,
        uninvoiced: uninvoicedItems.length,
        appointments: appointmentDocItems.length,
        pendingDocs: pendingDocItems.length
      }
    },
    'Server daily reminder scan completed'
  );

  return {
    success: true,
    date: todayStr,
    recipient: targetRecipient,
    counts: {
      operational: operationalItems.length,
      unclaimedMdr: unclaimedMdrItems.length,
      uninvoiced: uninvoicedItems.length,
      appointments: appointmentDocItems.length,
      pendingDocs: pendingDocItems.length
    },
    results
  };
}
