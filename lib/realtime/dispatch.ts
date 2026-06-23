import type { C2cRealtimeEvent, ThreadRealtimeEvent } from "@/lib/realtime/events";
import { C2C_EVENT_NAME, THREAD_EVENT_NAME } from "@/lib/realtime/events";
import { c2cChannelName, c2cRedisChannel, threadChannelName, threadRedisChannel } from "@/lib/realtime/channels";
import { triggerPusherEvent } from "@/lib/realtime/pusher-server";
import { publishMemory, publishRedis } from "@/lib/realtime/redis";
import { isPusherConfigured, isRedisConfigured } from "@/lib/realtime/config";

export async function dispatchC2cEvent(event: C2cRealtimeEvent) {
  const channel = c2cChannelName(event.conversationId);
  const redisChannel = c2cRedisChannel(event.conversationId);

  if (isPusherConfigured()) {
    await triggerPusherEvent(channel, C2C_EVENT_NAME, event);
  }

  if (isRedisConfigured()) {
    await publishRedis(redisChannel, event);
  } else {
    publishMemory(redisChannel, event);
  }
}

export async function dispatchThreadEvent(event: ThreadRealtimeEvent) {
  const channel = threadChannelName(event.threadId);
  const redisChannel = threadRedisChannel(event.threadId);

  if (isPusherConfigured()) {
    await triggerPusherEvent(channel, THREAD_EVENT_NAME, event);
  }

  if (isRedisConfigured()) {
    await publishRedis(redisChannel, event);
  } else {
    publishMemory(redisChannel, event);
  }
}

export function serializeC2cMessageEvent(input: {
  conversationId: string;
  message: {
    id: string;
    body: string;
    senderId: string;
    createdAt: Date;
    readAt: Date | null;
  };
}): C2cRealtimeEvent {
  return {
    type: "message",
    conversationId: input.conversationId,
    message: {
      id: input.message.id,
      body: input.message.body,
      senderId: input.message.senderId,
      createdAt: input.message.createdAt.toISOString(),
      readAt: input.message.readAt?.toISOString() ?? null,
    },
  };
}
