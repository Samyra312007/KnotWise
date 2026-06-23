"use client";

import * as React from "react";
import type { C2cRealtimeEvent } from "@/lib/realtime/events";
import { C2C_EVENT_NAME } from "@/lib/realtime/events";
import { c2cChannelName } from "@/lib/realtime/channels";
import { fetchRealtimeConfig } from "@/lib/hooks/use-realtime-config";

export function useC2cRealtime(input: {
  conversationId: string;
  enabled: boolean;
  onEvent: (event: C2cRealtimeEvent) => void;
}) {
  const onEventRef = React.useRef(input.onEvent);
  onEventRef.current = input.onEvent;

  React.useEffect(() => {
    if (!input.enabled || !input.conversationId) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    void fetchRealtimeConfig()
      .then(async (config) => {
        if (disposed) return;

        if (config.mode === "pusher" && config.pusher?.key) {
          const { default: Pusher } = await import("pusher-js");
          const pusher = new Pusher(config.pusher.key, {
            cluster: config.pusher.cluster,
            channelAuthorization: {
              transport: "ajax",
              endpoint: "/api/realtime/pusher/auth",
            },
          });
          const channel = pusher.subscribe(c2cChannelName(input.conversationId));
          const handler = (event: C2cRealtimeEvent) => onEventRef.current(event);
          channel.bind(C2C_EVENT_NAME, handler);
          cleanup = () => {
            channel.unbind(C2C_EVENT_NAME, handler);
            pusher.unsubscribe(c2cChannelName(input.conversationId));
            pusher.disconnect();
          };
          return;
        }

        if (config.mode === "redis-sse" || config.mode === "memory-sse") {
          const source = new EventSource(`/api/c2c/conversations/${input.conversationId}/stream`);
          source.onmessage = (message) => {
            try {
              const event = JSON.parse(message.data) as C2cRealtimeEvent | { type: "connected" };
              if (event.type === "message" || event.type === "read") onEventRef.current(event);
            } catch {
              return;
            }
          };
          cleanup = () => source.close();
        }
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [input.conversationId, input.enabled]);
}
