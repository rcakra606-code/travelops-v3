import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType
} from 'react-router-dom';
import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

if (dsn) {
  const isProd = import.meta.env.PROD;

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE,
    release: import.meta.env.VITE_SENTRY_RELEASE || 'travelops-frontend@4.0.0',
    integrations: [
      Sentry.reactRouterV7BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      }),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true
      }),
      Sentry.feedbackIntegration({
        colorScheme: 'system',
        autoInject: false
      }),
      Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] })
    ],
    enableLogs: true,
    // Sample 100% of traces in local/dev for verification; 10% in production
    tracesSampleRate: isProd ? 0.1 : 1.0,
    tracePropagationTargets: [/^\//, /^https:\/\/.*\.up\.railway\.app\/api/],
    // Session Replay: 10% of sessions in production, 100% when an error occurs
    replaysSessionSampleRate: isProd ? 0.1 : 0.25,
    replaysOnErrorSampleRate: 1.0
  });
}
