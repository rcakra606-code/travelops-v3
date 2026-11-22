import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createUserSchema,
  sendEmailSchema,
  copilotChatSchema,
  generateDestinationSchema,
  validateBody
} from './apiSchemas.js';

test('createUserSchema validates valid admin user creation payload and applies defaults', () => {
  const result = createUserSchema.safeParse({
    email: ' staff@travelops.com ',
    password: 'StrongPassword123!',
    name: 'Andi Consultant'
  });
  assert.equal(result.success, true);
  assert.equal(result.data.email, 'staff@travelops.com');
  assert.equal(result.data.role, 'Staff');
  assert.equal(result.data.status, 'Active');
  assert.equal(result.data.mustChangePassword, true);
});

test('sendEmailSchema supports comma-separated recipients and rejects invalid emails', () => {
  const valid = sendEmailSchema.safeParse({
    to: 'ops@agency.com, manager@agency.com',
    subject: 'Daily Ops Alert',
    category: 'daily_document_reminder'
  });
  assert.equal(valid.success, true);

  const invalid = sendEmailSchema.safeParse({
    to: 'not-an-email'
  });
  assert.equal(invalid.success, false);
});

test('copilotChatSchema enforces non-empty messages and valid history roles', () => {
  assert.equal(copilotChatSchema.safeParse({ message: '   ' }).success, false);
  const ok = copilotChatSchema.safeParse({
    message: 'Syarat visa Schengen untuk WNI?',
    history: [{ role: 'user', content: 'Halo' }],
    currentPath: '/documents'
  });
  assert.equal(ok.success, true);
});

test('validateBody Express middleware responds 400 with structured issues on failure', () => {
  const middleware = validateBody(generateDestinationSchema);
  let statusCode = 200;
  let jsonPayload = null;
  let nextCalled = false;

  const req = { body: { query: 'Tokyo', type: 'planet' } };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonPayload = body;
      return this;
    }
  };

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 400);
  assert.equal(jsonPayload.success, false);
  assert.ok(Array.isArray(jsonPayload.issues) && jsonPayload.issues.length > 0);
});
