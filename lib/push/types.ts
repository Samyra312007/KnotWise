export type PushCategory = "intro" | "message" | "reminder";

export type PushPayload =
  | { type: "intro"; suggestionId: string }
  | { type: "mutual"; mutualMatchId: string; conversationId?: string }
  | { type: "message"; conversationId: string; preview: string }
  | { type: "reminder"; eventId: string };

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: PushPayload & { url: string; deepLink: string };
};
