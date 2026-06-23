import Redis from "ioredis";
import { isRedisConfigured } from "@/lib/realtime/config";

let publisher: Redis | null = null;

export function getRedisPublisher(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (!publisher) {
    publisher = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }
  return publisher;
}

export function createRedisSubscriber(): Redis | null {
  if (!isRedisConfigured()) return null;
  return new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });
}

export async function publishRedis(channel: string, payload: unknown) {
  const redis = getRedisPublisher();
  if (!redis) return false;
  if (redis.status !== "ready") {
    await redis.connect().catch(() => undefined);
  }
  await redis.publish(channel, JSON.stringify(payload));
  return true;
}

type MemoryListener = (payload: unknown) => void;

declare global {
  var __knotwiseRealtimeBus: Map<string, Set<MemoryListener>> | undefined;
}

function memoryBus() {
  if (!globalThis.__knotwiseRealtimeBus) {
    globalThis.__knotwiseRealtimeBus = new Map();
  }
  return globalThis.__knotwiseRealtimeBus;
}

export function publishMemory(channel: string, payload: unknown) {
  const listeners = memoryBus().get(channel);
  if (!listeners) return false;
  for (const listener of listeners) listener(payload);
  return listeners.size > 0;
}

export function subscribeMemory(channel: string, listener: MemoryListener) {
  const bus = memoryBus();
  const set = bus.get(channel) ?? new Set<MemoryListener>();
  set.add(listener);
  bus.set(channel, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) bus.delete(channel);
  };
}
