export type ApiConfig = {
  baseUrl: string;
  token?: string;
  onUnauthorized?: () => void;
};

export type ApiErrorBody = {
  error?: { code: string; message: string };
};

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type ClientSessionInfo = {
  clientId: string;
  customerId: string;
  email: string;
  firstName: string;
  stage: string;
};

export type IntroReveal = {
  revealLevel: "limited" | "full";
  firstName: string;
  lastName?: string;
  age: number;
  city: string;
  country: string;
  photoUrl?: string;
  bioHeadline?: string;
  score: number;
  bucket: string;
  designation?: string;
  currentCompany?: string;
  educationLevel?: string;
  religion?: string;
  caste?: string;
  gotra?: string;
  email?: string;
  phone?: string;
};

export type MatchListItem = {
  id: string;
  status: string;
  revealLevel: "limited" | "full";
  score: number;
  bucket: string;
  mutualMatchId?: string;
  conversationId?: string;
  candidate: IntroReveal;
};

export type MatchDetail = MatchListItem & {
  explanation?: string;
  breakdown?: Record<string, number>;
  feedbackReason?: string;
  feedbackAt?: string;
  viewedAt?: string;
};

export type ConversationListItem = {
  id: string;
  mutualMatchId: string;
  counterpart: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string | null;
  };
  blocked: boolean;
  lastMessage?: {
    id: string;
    body: string;
    createdAt: string;
    mine: boolean;
  } | null;
};

export type ChatMessage = {
  id: string;
  body: string;
  mine: boolean;
  createdAt: string;
  readAt?: string | null;
};

export type ThreadMessage = {
  id: string;
  authorType: string;
  body: string;
  createdAt: string;
};

export type DiscoverItem = {
  poolProfileId: string;
  score: number;
  bucket: string;
  verified: boolean;
  interestStatus: string | null;
  candidate: IntroReveal;
};

export type ClientHome = {
  customer: {
    id: string;
    stage: string;
    firstName: string;
    lastName: string;
    city: string;
    photoUrl?: string | null;
    matchmakerName: string;
  };
  email: string;
};

export type OnboardingState = {
  customerId: string;
  biodata: Record<string, unknown>;
  progress: {
    step: number | null;
    completeness: number;
    minCompleteness: number;
    completed: boolean;
  };
  options: Record<string, unknown>;
};

async function request<T>(config: ApiConfig, path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (config.token) headers.authorization = `Bearer ${config.token}`;

  const res = await fetch(`${config.baseUrl}${path}`, { ...init, headers });
  const data = (await res.json().catch(() => ({}))) as T & ApiErrorBody;

  if (res.status === 401) {
    config.onUnauthorized?.();
  }

  if (!res.ok) {
    throw new ApiError(res.status, data.error?.code ?? "API_ERROR", data.error?.message ?? `API ${res.status}`);
  }

  return data;
}

export function createClientApi(config: ApiConfig) {
  return {
    requestMagicLink: (email: string) =>
      request<{ ok: boolean }>(config, "/api/client/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),

    exchangeMagicToken: (magicToken: string) =>
      request<{ ok: boolean; token: string; needsOnboarding: boolean; client: ClientSessionInfo }>(
        config,
        "/api/client/auth/token",
        {
          method: "POST",
          body: JSON.stringify({ magicToken }),
        }
      ),

    validateToken: () =>
      request<{ ok: boolean; needsOnboarding: boolean; client: ClientSessionInfo }>(
        config,
        "/api/client/auth/token"
      ),

    logout: () =>
      request<{ ok: boolean }>(config, "/api/client/auth/token", {
        method: "DELETE",
      }),

    home: () => request<ClientHome>(config, "/api/client/me"),

    onboarding: () => request<OnboardingState>(config, "/api/client/onboarding"),

    updateOnboarding: (body: { step?: number; biodata?: Record<string, unknown>; complete?: boolean }) =>
      request<{ ok: boolean; progress: OnboardingState["progress"] }>(config, "/api/client/onboarding", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),

    matches: () => request<{ items: MatchListItem[] }>(config, "/api/client/matches"),

    matchDetail: (id: string) => request<MatchDetail>(config, `/api/client/matches/${id}`),

    matchFeedback: (id: string, decision: "accept" | "decline", reason?: string) =>
      request<{ ok: boolean; status: string; mutualMatchId?: string }>(
        config,
        `/api/client/matches/${id}/feedback`,
        {
          method: "POST",
          body: JSON.stringify({ decision, reason }),
        }
      ),

    mutualDetail: (id: string) =>
      request<{ candidate: IntroReveal; conversationId?: string }>(config, `/api/client/mutual/${id}`),

    conversations: () => request<{ items: ConversationListItem[] }>(config, "/api/c2c/conversations"),

    conversation: (id: string) => request<ConversationListItem>(config, `/api/c2c/conversations/${id}`),

    conversationMessages: (id: string) =>
      request<{ messages: ChatMessage[] }>(config, `/api/c2c/conversations/${id}/messages`),

    sendConversationMessage: (id: string, body: string) =>
      request<{ message: ChatMessage }>(config, `/api/c2c/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      }),

    threadMessages: () =>
      request<{ threadId: string; messages: ThreadMessage[] }>(config, "/api/client/messages"),

    sendThreadMessage: (body: string) =>
      request<{ message: ThreadMessage }>(config, "/api/client/messages", {
        method: "POST",
        body: JSON.stringify({ body }),
      }),

    profile: () =>
      request<{
        customerId: string;
        profile: Record<string, unknown>;
        photoUrl?: string | null;
        stage: string;
        pendingRevisions: Array<{ id: string; fieldPath: string; status: string }>;
      }>(config, "/api/client/profile"),

    updateProfile: (patch: Record<string, unknown>) =>
      request<{ ok: boolean; applied: string[]; pending: string[]; pendingRevision: boolean }>(
        config,
        "/api/client/profile",
        {
          method: "PATCH",
          body: JSON.stringify(patch),
        }
      ),

    discover: (filters?: {
      city?: string;
      religion?: string;
      ageMin?: number;
      ageMax?: number;
      q?: string;
      cursor?: string;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (filters?.city) params.set("city", filters.city);
      if (filters?.religion) params.set("religion", filters.religion);
      if (filters?.ageMin != null) params.set("ageMin", String(filters.ageMin));
      if (filters?.ageMax != null) params.set("ageMax", String(filters.ageMax));
      if (filters?.q) params.set("q", filters.q);
      if (filters?.cursor) params.set("cursor", filters.cursor);
      if (filters?.limit != null) params.set("limit", String(filters.limit));
      const qs = params.toString();
      return request<{ items: DiscoverItem[]; nextCursor?: string; filters: { cities: string[]; religions: string[] } }>(
        config,
        `/api/client/discover${qs ? `?${qs}` : ""}`
      );
    },

    expressDiscoverInterest: (poolProfileId: string, note?: string) =>
      request<{ ok: boolean; interest: { id: string; status: string } }>(
        config,
        `/api/client/discover/${poolProfileId}/interest`,
        {
          method: "POST",
          body: JSON.stringify({ note }),
        }
      ),

    registerDevice: (token: string, platform: "ios" | "android" | "web") =>
      request<{ ok: boolean }>(config, "/api/client/devices", {
        method: "POST",
        body: JSON.stringify({ token, platform }),
      }),

    notificationPreferences: () =>
      request<{
        preferences: { introPush: boolean; messagePush: boolean; reminderPush: boolean };
      }>(config, "/api/client/notifications/preferences"),

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

export type ClientApi = ReturnType<typeof createClientApi>;

export type { CustomerListItem, ScoredCandidate } from "../../lib/types";

async function matchmakerRequest<T>(config: ApiConfig, path: string, init?: RequestInit): Promise<T> {
  return request<T>(config, path, init);
}

export function createApiClient(config: ApiConfig) {
  return {
    login: (username: string, password: string) =>
      matchmakerRequest<{ token: string }>(config, "/api/auth/token", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    customers: () => matchmakerRequest<{ items: import("../../lib/types").CustomerListItem[] }>(config, "/api/customers"),
    customerMatches: (id: string) =>
      matchmakerRequest<{ items: import("../../lib/types").ScoredCandidate[] }>(
        config,
        `/api/customers/${id}/matches?bucket=high&limit=12`
      ),
    client: createClientApi(config),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
