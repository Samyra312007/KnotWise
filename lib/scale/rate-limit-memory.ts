import { AUTH_RATE_LIMIT, PUBLIC_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/lib/scale/config";

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Bucket = { count: number; resetAt: number };

const memoryBuckets = new Map<string, Bucket>();

function checkMemoryBucket(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memoryBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    const resetAt = now + windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { ok: true, limit, remaining: limit - 1, resetAt };
  }
  if (bucket.count >= limit) {
    return { ok: false, limit, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.count += 1;
  return { ok: true, limit, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function checkRateLimitSync(key: string, limit: number, windowMs = RATE_LIMIT_WINDOW_MS): RateLimitResult {
  return checkMemoryBucket(key, limit, windowMs);
}

export function rateLimitKeyForRequest(input: {
  ip: string;
  pathname: string;
  authenticated: boolean;
  actorId?: string;
}): { key: string; limit: number } {
  if (input.authenticated && input.actorId) {
    return { key: `auth:${input.actorId}`, limit: AUTH_RATE_LIMIT };
  }
  return { key: `ip:${input.ip}:${input.pathname.split("/").slice(0, 4).join("/")}`, limit: PUBLIC_RATE_LIMIT };
}

export function clientIpFromHeaders(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
