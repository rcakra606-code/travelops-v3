import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';

dotenv.config();

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  const isProd = process.env.NODE_ENV === 'production';

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release:
      process.env.SENTRY_RELEASE ||
      process.env.RAILWAY_GIT_COMMIT_SHA ||
      'travelops-server@4.0.0',
    integrations: [
      Sentry.expressIntegration(),
      Sentry.googleGenAIIntegration({
        recordInputs: false,
        recordOutputs: false
      })
    ],
    enableLogs: true,
    // Sample 100% of traces locally; 10% in production
    tracesSampleRate: isProd ? 0.1 : 1.0,
    sendDefaultPii: false
  });
}
