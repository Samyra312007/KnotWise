"use client";

import * as React from "react";

export type RealtimeMode = "pusher" | "redis-sse" | "memory-sse" | "poll";

export type RealtimeConfig = {
  mode: RealtimeMode;
  pusher: { key: string; cluster: string } | null;
};

let cached: Promise<RealtimeConfig> | null = null;

export function fetchRealtimeConfig(): Promise<RealtimeConfig> {
  if (!cached) {
    cached = fetch("/api/realtime/config").then((r) => r.json() as Promise<RealtimeConfig>);
  }
  return cached;
}

export function useRealtimeConfig() {
  const [config, setConfig] = React.useState<RealtimeConfig | null>(null);

  React.useEffect(() => {
    fetchRealtimeConfig()
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  return config;
}
