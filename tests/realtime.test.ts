import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  c2cChannelName,
  c2cRedisChannel,
  parseC2cChannelName,
  parseThreadChannelName,
  threadChannelName,
  threadRedisChannel,
} from "@/lib/realtime/channels";
import { serializeC2cMessageEvent } from "@/lib/realtime/dispatch";
import { publishMemory, subscribeMemory } from "@/lib/realtime/redis";

describe("realtime channels", () => {
  it("builds c2c channel names", () => {
    expect(c2cChannelName("abc")).toBe("private-c2c-abc");
    expect(c2cRedisChannel("abc")).toBe("c2c:conversation:abc");
    expect(parseC2cChannelName("private-c2c-abc")).toBe("abc");
    expect(parseC2cChannelName("other")).toBeNull();
  });

  it("builds thread channel names", () => {
    expect(threadChannelName("t1")).toBe("private-thread-t1");
    expect(threadRedisChannel("t1")).toBe("thread:t1");
    expect(parseThreadChannelName("private-thread-t1")).toBe("t1");
    expect(parseThreadChannelName("private-c2c-x")).toBeNull();
  });
});

describe("realtime dispatch serialization", () => {
  it("serializes c2c message events", () => {
    const createdAt = new Date("2026-06-23T12:00:00.000Z");
    const event = serializeC2cMessageEvent({
      conversationId: "conv-1",
      message: {
        id: "msg-1",
        body: "Hello",
        senderId: "cust-1",
        createdAt,
        readAt: null,
      },
    });

    expect(event).toEqual({
      type: "message",
      conversationId: "conv-1",
      message: {
        id: "msg-1",
        body: "Hello",
        senderId: "cust-1",
        createdAt: "2026-06-23T12:00:00.000Z",
        readAt: null,
      },
    });
  });
});

describe("memory realtime bus", () => {
  const originalBus = globalThis.__knotwiseRealtimeBus;

  beforeEach(() => {
    globalThis.__knotwiseRealtimeBus = undefined;
  });

  afterEach(() => {
    globalThis.__knotwiseRealtimeBus = originalBus;
  });

  it("delivers published events to subscribers", () => {
    const received: unknown[] = [];
    const unsubscribe = subscribeMemory("test:channel", (payload) => {
      received.push(payload);
    });

    publishMemory("test:channel", { hello: "world" });
    unsubscribe();

    expect(received).toEqual([{ hello: "world" }]);
  });
});

describe("realtime mode selection", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("prefers pusher when fully configured", async () => {
    process.env.PUSHER_APP_ID = "1";
    process.env.PUSHER_KEY = "key";
    process.env.PUSHER_SECRET = "secret";
    process.env.NEXT_PUBLIC_PUSHER_KEY = "pub";
    delete process.env.REDIS_URL;

    const { realtimeMode } = await import("@/lib/realtime/config");
    expect(realtimeMode()).toBe("pusher");
  });

  it("falls back to redis-sse when redis is configured", async () => {
    delete process.env.PUSHER_APP_ID;
    delete process.env.PUSHER_KEY;
    delete process.env.PUSHER_SECRET;
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    process.env.REDIS_URL = "redis://localhost:6379";

    const { realtimeMode } = await import("@/lib/realtime/config");
    expect(realtimeMode()).toBe("redis-sse");
  });

  it("uses memory-sse in development without infra", async () => {
    delete process.env.PUSHER_APP_ID;
    delete process.env.PUSHER_KEY;
    delete process.env.PUSHER_SECRET;
    delete process.env.NEXT_PUBLIC_PUSHER_KEY;
    delete process.env.REDIS_URL;

    const { realtimeMode } = await import("@/lib/realtime/config");
    if (process.env.NODE_ENV === "development") {
      expect(realtimeMode()).toBe("memory-sse");
    } else {
      expect(realtimeMode()).toBe("poll");
    }
  });
});
