import * as Sentry from "@sentry/node";

let initialized = false;

const numberFromEnv = (name: string, fallback: number) => {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
};

export const initSentry = () => {
  if (initialized) return;

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) {
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
      tracesSampleRate: numberFromEnv("SENTRY_TRACES_SAMPLE_RATE", 0),
      sendDefaultPii: false,
    });
    initialized = true;
  } catch (error) {
    // Observability must never prevent the API from starting.
    console.error("Sentry initialization failed", error);
  }
};

export const setupSentryExpress = (app: Parameters<typeof Sentry.setupExpressErrorHandler>[0]) => {
  if (initialized) {
    Sentry.setupExpressErrorHandler(app);
  }
};
