"use client";

import * as React from "react";
import type { ThreadRealtimeEvent } from "@/lib/realtime/events";
import { THREAD_EVENT_NAME } from "@/lib/realtime/events";
import { threadChannelName } from "@/lib/realtime/channels";
import { fetchRealtimeConfig } from "@/lib/hooks/use-realtime-config";

export function useThreadRealtime(input: {
  threadId: string | null;
  enabled: boolean;
  onMessage: (message: ThreadRealtimeEvent["message"]) => void;
}) {
  const onMessageRef = React.useRef(input.onMessage);
  onMessageRef.current = input.onMessage;

  React.useEffect(() => {
    if (!input.enabled || !input.threadId) return;

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
          const channel = pusher.subscribe(threadChannelName(input.threadId!));
          const handler = (event: ThreadRealtimeEvent) => {
            if (event.type === "thread_message") onMessageRef.current(event.message);
          };
          channel.bind(THREAD_EVENT_NAME, handler);
          cleanup = () => {
            channel.unbind(THREAD_EVENT_NAME, handler);
            pusher.unsubscribe(threadChannelName(input.threadId!));
            pusher.disconnect();
          };
          return;
        }

        const source = new EventSource("/api/client/messages/stream");
        source.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data) as ThreadRealtimeEvent | { type: "connected" };
            if (payload.type === "thread_message") onMessageRef.current(payload.message);
          } catch {
            return;
          }
        };
        cleanup = () => source.close();
      })
      .catch(() => undefined);

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [input.enabled, input.threadId]);
}
