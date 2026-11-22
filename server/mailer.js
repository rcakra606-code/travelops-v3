import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { logger } from './logger.js';
import { cacheGet, cacheSet } from './cache.js';

const DAILY_REMINDER_CATEGORIES = new Set([
  'daily_reminder',
  'daily_operational_reminder',
  'daily_admin_reminder',
  'daily_document_reminder'
]);

const transporterPool = new Map();
let resendInstance = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

function getPooledSmtpTransporter({ host, port, user, pass }) {
  const key = `${host}|${port}|${user}|${pass ? pass.length : 0}`;
  let existing = transporterPool.get(key);
  if (existing && existing.pass === pass) {
    return existing.transporter;
  }

  if (existing?.transporter) {
    try {
      existing.transporter.close();
    } catch {
      // Ignore close failure
    }
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
  });

  transporterPool.set(key, { transporter, pass });
  return transporter;
}

export function getLocalDateStr(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: process.env.APP_TIMEZONE || 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(date);
}

export function isDailyReminderCategory(category) {
  return DAILY_REMINDER_CATEGORIES.has(String(category || '').trim());
}

/**
 * Checks whether a daily reminder for (category, recipient, today) was already dispatched.
 * Checks fast cache first, then durable PostgreSQL table `travelops_reminder_dispatches`.
 */
export async function checkReminderAlreadyDispatched({ supabaseAdmin, category, to, dateStr }) {
  if (!isDailyReminderCategory(category)) return false;

  const cleanTo = to.toLowerCase().trim();
  const cacheKey = `reminder:${category}:${cleanTo}:${dateStr}`;

  const cached = await cacheGet(cacheKey);
  if (cached) return true;

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('travelops_reminder_dispatches')
        .select('id')
        .eq('category', category)
        .eq('recipient_email', cleanTo)
        .eq('dispatch_date', dateStr)
        .maybeSingle();

      if (!error && data?.id) {
        await cacheSet(cacheKey, true, 12 * 60 * 60);
        return true;
      }
    } catch (err) {
      logger.warn({ err: err.message, category }, 'Could not check DB reminder idempotency');
    }
  }

  return false;
}

export async function recordReminderDispatched({
  supabaseAdmin,
  category,
  to,
  dateStr,
  provider,
  messageId,
  subject
}) {
  if (!isDailyReminderCategory(category)) return;

  const cleanTo = to.toLowerCase().trim();
  const cacheKey = `reminder:${category}:${cleanTo}:${dateStr}`;
  await cacheSet(cacheKey, true, 18 * 60 * 60);

  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('travelops_reminder_dispatches').upsert(
        {
          category,
          recipient_email: cleanTo,
          dispatch_date: dateStr,
          provider: provider || 'smtp',
          message_id: messageId || null,
          subject: (subject || '').slice(0, 300)
        },
        { onConflict: 'category,recipient_email,dispatch_date' }
      );
    } catch (err) {
      logger.warn({ err: err.message, category }, 'Could not persist reminder dispatch record');
    }
  }
}

/**
 * Sends transactional email via Resend HTTP API (preferred when RESEND_API_KEY is set
 * and no custom SMTP credentials override it) or pooled Nodemailer SMTP fallback.
 */
export async function dispatchTransactionalEmail({
  to,
  subject,
  text,
  html,
  smtpConfig,
  category,
  supabaseAdmin
}) {
  const dateStr = getLocalDateStr();
  const alreadySent = await checkReminderAlreadyDispatched({
    supabaseAdmin,
    category,
    to,
    dateStr
  });

  if (alreadySent) {
    logger.info({ category, to, dateStr }, 'Skipping duplicate daily reminder email');
    return {
      success: true,
      skipped: true,
      provider: 'idempotency-guard',
      message: `Daily reminder (${category}) already delivered to ${to} today (${dateStr}). Skipped to prevent spam.`
    };
  }

  const senderName = smtpConfig?.senderName || process.env.SMTP_SENDER_NAME || 'TravelOps System';
  const emailSubject = subject || 'TravelOps Notification';
  const emailText = text || 'This is a notification from TravelOps.';
  const emailHtml = html || '<b>This is a notification from TravelOps.</b>';

  const hasCustomSmtpOverride = Boolean(smtpConfig?.user && smtpConfig?.pass);
  const resend = !hasCustomSmtpOverride ? getResendClient() : null;

  // 1. Fast Path: Resend HTTP API
  if (resend) {
    const fromEmail = process.env.RESEND_FROM || `${senderName} <onboarding@resend.dev>`;
    const recipients = to
      .split(',')
      .map((addr) => addr.trim())
      .filter(Boolean);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    if (error) {
      throw new Error(error.message || 'Resend API failed to send email.');
    }

    const messageId = data?.id || `resend-${Date.now()}`;
    await recordReminderDispatched({
      supabaseAdmin,
      category,
      to,
      dateStr,
      provider: 'resend',
      messageId,
      subject: emailSubject
    });

    logger.info({ provider: 'resend', to, messageId, category }, 'Email delivered via Resend');
    return {
      success: true,
      provider: 'resend',
      messageId,
      message: `Email successfully delivered to ${to} via Resend! MessageID: ${messageId}`
    };
  }

  // 2. Pooled Nodemailer SMTP Path
  const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(smtpConfig?.port || process.env.SMTP_PORT || 587);
  const user = smtpConfig?.user || process.env.SMTP_USER;
  const pass = smtpConfig?.pass || process.env.SMTP_PASS;

  if (!user || !pass || user === 'your_email@gmail.com' || pass === 'your_app_password') {
    const err = new Error(
      'Email provider not configured. Set RESEND_API_KEY or valid SMTP Username/Password in Settings.'
    );
    err.statusCode = 400;
    throw err;
  }

  const transporter = getPooledSmtpTransporter({ host, port, user, pass });
  const info = await transporter.sendMail({
    from: `"${senderName}" <${user}>`,
    to,
    subject: emailSubject,
    text: emailText,
    html: emailHtml
  });

  await recordReminderDispatched({
    supabaseAdmin,
    category,
    to,
    dateStr,
    provider: 'smtp-pooled',
    messageId: info.messageId,
    subject: emailSubject
  });

  logger.info(
    { provider: 'smtp-pooled', to, messageId: info.messageId, category },
    'Email delivered via pooled SMTP'
  );
  return {
    success: true,
    provider: 'smtp-pooled',
    messageId: info.messageId,
    message: `Email successfully delivered to ${to}! MessageID: ${info.messageId}`
  };
}

export function getMailerStatus() {
  return {
    resendConfigured: Boolean(process.env.RESEND_API_KEY),
    smtpConfigured: Boolean(
      process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_USER !== 'your_email@gmail.com'
    ),
    pooledTransporters: transporterPool.size
  };
}
