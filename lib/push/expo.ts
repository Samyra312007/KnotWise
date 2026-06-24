import type { PushMessage } from "@/lib/push/types";
import { expoAccessToken, isPushDryRun } from "@/lib/push/config";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type ExpoTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

declare global {
  var __knotwisePushDryRunLog: PushMessage[] | undefined;
}

export function recentDryRunPushes(limit = 20): PushMessage[] {
  const log = globalThis.__knotwisePushDryRunLog ?? [];
  return log.slice(-limit);
}

function logDryRun(messages: PushMessage[]) {
  if (!globalThis.__knotwisePushDryRunLog) {
    globalThis.__knotwisePushDryRunLog = [];
  }
  globalThis.__knotwisePushDryRunLog.push(...messages);
  if (globalThis.__knotwisePushDryRunLog.length > 100) {
    globalThis.__knotwisePushDryRunLog = globalThis.__knotwisePushDryRunLog.slice(-100);
  }
}

export function isExpoPushToken(token: string): boolean {
  return (
    token.startsWith("ExponentPushToken[") ||
    token.startsWith("ExpoPushToken[") ||
    token.startsWith("ExpoPushToken")
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendExpoPushBatch(messages: PushMessage[]): Promise<{
  sent: number;
  invalidTokens: string[];
}> {
  if (messages.length === 0) return { sent: 0, invalidTokens: [] };

  if (isPushDryRun()) {
    logDryRun(messages);
    return { sent: messages.length, invalidTokens: [] };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const accessToken = expoAccessToken();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const body = messages.map((message) => ({
    to: message.to,
    title: message.title,
    body: message.body,
    data: message.data,
    sound: "default",
    priority: "high",
  }));

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastError = await res.text();
        await sleep(400 * (attempt + 1));
        continue;
      }

      const payload = (await res.json()) as { data?: ExpoTicket[] };
      const tickets = payload.data ?? [];
      const invalidTokens: string[] = [];

      tickets.forEach((ticket, index) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidTokens.push(messages[index]?.to ?? "");
        }
      });

      const okCount = tickets.filter((ticket) => ticket.status === "ok").length;
      return { sent: okCount, invalidTokens: invalidTokens.filter(Boolean) };
    } catch (error) {
      lastError = error;
      await sleep(400 * (attempt + 1));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Expo push failed.");
}
