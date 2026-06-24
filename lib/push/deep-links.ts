import type { PushPayload } from "@/lib/push/types";

export function portalBaseUrl(): string {
  const raw = process.env.CLIENT_PORTAL_URL ?? "http://localhost:3000/portal";
  return raw.replace(/\/$/, "");
}

export function portalUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${portalBaseUrl()}${normalized}`;
}

export function deepLink(path: string): string {
  const normalized = path.replace(/^\//, "");
  return `knotwise://${normalized}`;
}

export function urlsForPayload(payload: PushPayload): { url: string; deepLink: string } {
  switch (payload.type) {
    case "intro":
      return {
        url: portalUrl(`/matches/${payload.suggestionId}`),
        deepLink: deepLink(`portal/matches/${payload.suggestionId}`),
      };
    case "mutual":
      if (payload.conversationId) {
        return {
          url: portalUrl(`/chat/${payload.conversationId}`),
          deepLink: deepLink(`portal/chat/${payload.conversationId}`),
        };
      }
      return {
        url: portalUrl("/matches"),
        deepLink: deepLink("portal/matches"),
      };
    case "message":
      return {
        url: portalUrl(`/chat/${payload.conversationId}`),
        deepLink: deepLink(`portal/chat/${payload.conversationId}`),
      };
    case "reminder":
      return {
        url: portalUrl("/"),
        deepLink: deepLink(`portal/reminders/${payload.eventId}`),
      };
  }
}
