export const PUBLIC_RATE_LIMIT = 100;
export const AUTH_RATE_LIMIT = 1000;
export const RATE_LIMIT_WINDOW_MS = 60_000;

export const API_SLO_P95_MS: Record<string, number> = {
  "/api/health": 200,
  "/api/client/discover": 800,
  "/api/c2c/messages": 500,
  "/api/customers": 800,
};

export function isSentryEnabled(): boolean {
  return Boolean(process.env.SENTRY_DSN?.trim());
}

export function isCdnEnabled(): boolean {
  return Boolean(process.env.MEDIA_CDN_URL?.trim());
}
