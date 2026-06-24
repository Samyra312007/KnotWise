import type { CustomerListItem, ScoredCandidate } from "../../lib/types";

export type ApiConfig = {
  baseUrl: string;
  token?: string;
};

async function request<T>(config: ApiConfig, path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (config.token) headers.authorization = `Bearer ${config.token}`;
  const res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export function createApiClient(config: ApiConfig) {
  return {
    login: (username: string, password: string) =>
      request<{ token: string }>(config, "/api/auth/token", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    customers: () => request<{ items: CustomerListItem[] }>(config, "/api/customers"),
    customerMatches: (id: string) =>
      request<{ items: ScoredCandidate[] }>(config, `/api/customers/${id}/matches?bucket=high&limit=12`),
    clientMatches: () => request<{ items: unknown[] }>(config, "/api/client/matches"),
    clientFeedback: (id: string, status: "accepted" | "declined") =>
      request<{ ok: boolean }>(config, `/api/client/matches/${id}/feedback`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    clientMessages: () => request<{ messages: unknown[] }>(config, "/api/client/messages"),
    registerDevice: (token: string, platform: "ios" | "android" | "web") =>
      request<{ ok: boolean }>(config, "/api/client/devices", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
      }),
    notificationPreferences: () =>
      request<{ preferences: { introPush: boolean; messagePush: boolean; reminderPush: boolean } }>(
        config,
        "/api/client/notifications/preferences"
      ),
    updateNotificationPreferences: (prefs: {
      introPush?: boolean;
      messagePush?: boolean;
      reminderPush?: boolean;
    }) =>
      request<{ preferences: { introPush: boolean; messagePush: boolean; reminderPush: boolean } }>(
        config,
        "/api/client/notifications/preferences",
        {
          method: "PATCH",
          body: JSON.stringify(prefs),
        }
      ),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
