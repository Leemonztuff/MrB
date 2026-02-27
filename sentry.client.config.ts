import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  environment: process.env.NODE_ENV,
  
  enabled: process.env.NODE_ENV === 'production',
  
  tracesSampleRate: 1.0,
  
  replaysSessionSampleRate: 0.1,
  
  replaysOnErrorSampleRate: 1.0,
  
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],
  
  beforeSend(event, hint) {
    const error = hint.originalException;
    if (error && error.message) {
      event.fingerprint = ['{{ default }}', error.message];
    }
    return event;
  },
});
