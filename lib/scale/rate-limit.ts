import { RATE_LIMIT_WINDOW_MS } from "@/lib/scale/config";
import { getRedisPublisher } from "@/lib/realtime/redis";
import {
  checkRateLimitSync,
  type RateLimitResult,
  rateLimitKeyForRequest,
  clientIpFromHeaders,
} from "@/lib/scale/rate-limit-memory";

export type { RateLimitResult };
export { checkRateLimitSync, rateLimitKeyForRequest, clientIpFromHeaders };

async function checkRedisBucket(key: string, limit: number, windowMs: number): Promise<RateLimitResult | null> {
  const redis = getRedisPublisher();
  if (!redis) return null;
  try {
    if (redis.status !== "ready") await redis.connect().catch(() => undefined);
    const windowKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;
    const count = await redis.incr(windowKey);
    if (count === 1) await redis.pexpire(windowKey, windowMs);
    const resetAt = (Math.floor(Date.now() / windowMs) + 1) * windowMs;
    const remaining = Math.max(0, limit - count);
    return { ok: count <= limit, limit, remaining, resetAt };
  } catch {
    return null;
  }
}

export async function checkRateLimit(key: string, limit: number, windowMs = RATE_LIMIT_WINDOW_MS): Promise<RateLimitResult> {
  const redisResult = await checkRedisBucket(key, limit, windowMs);
  if (redisResult) return redisResult;
  return checkRateLimitSync(key, limit, windowMs);
}
