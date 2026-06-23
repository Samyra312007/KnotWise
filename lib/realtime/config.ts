export function isPusherConfigured(): boolean {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.NEXT_PUBLIC_PUSHER_KEY
  );
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export function pusherCluster(): string {
  return process.env.PUSHER_CLUSTER ?? "ap2";
}

export function realtimeMode(): "pusher" | "redis-sse" | "memory-sse" | "poll" {
  if (isPusherConfigured()) return "pusher";
  if (isRedisConfigured()) return "redis-sse";
  if (process.env.NODE_ENV !== "production") return "memory-sse";
  return "poll";
}
