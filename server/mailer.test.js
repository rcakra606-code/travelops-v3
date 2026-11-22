import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isDailyReminderCategory,
  checkReminderAlreadyDispatched,
  recordReminderDispatched,
  getLocalDateStr
} from './mailer.js';

test('isDailyReminderCategory recognizes all 4 daily reminder channels including daily_document_reminder', () => {
  assert.equal(isDailyReminderCategory('daily_reminder'), true);
  assert.equal(isDailyReminderCategory('daily_operational_reminder'), true);
  assert.equal(isDailyReminderCategory('daily_admin_reminder'), true);
  assert.equal(isDailyReminderCategory('daily_document_reminder'), true);
  assert.equal(isDailyReminderCategory('general'), false);
});

test('reminder idempotency guard prevents duplicate sends for the same category/recipient/date', async () => {
  const dateStr = getLocalDateStr();
  const recipient = `idempotency-test-${Date.now()}@travelops.local`;

  const before = await checkReminderAlreadyDispatched({
    supabaseAdmin: null,
    category: 'daily_document_reminder',
    to: recipient,
    dateStr
  });
  assert.equal(before, false);

  await recordReminderDispatched({
    supabaseAdmin: null,
    category: 'daily_document_reminder',
    to: recipient,
    dateStr,
    provider: 'test',
    messageId: 'msg-1',
    subject: 'Test'
  });

  const after = await checkReminderAlreadyDispatched({
    supabaseAdmin: null,
    category: 'daily_document_reminder',
    to: recipient,
    dateStr
  });
  assert.equal(after, true);
});
