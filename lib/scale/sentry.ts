import { isSentryEnabled } from "@/lib/scale/config";
import { logStructured } from "@/lib/scale/logger";

let initialized = false;

export async function initSentry() {
  if (!isSentryEnabled() || initialized) return;
  initialized = true;
  try {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      tracesSampleRate: 0.1,
    });
  } catch {
    initialized = false;
  }
}

export async function captureException(error: unknown, context?: Record<string, string>) {
  logStructured("error", error instanceof Error ? error.message : "Unknown error", context);
  if (!isSentryEnabled()) return;
  try {
    await initSentry();
    const Sentry = await import("@sentry/node");
    Sentry.captureException(error, { extra: context });
  } catch {
    return;
  }
}
