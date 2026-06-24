# 8. API Contracts

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved

---

## 8.1 Conventions

| Item | Rule |
|------|------|
| Base URL | `/api` |
| Auth | Cookie session (web) or `Authorization: Bearer` (mobile) |
| Content-Type | `application/json` |
| Errors | `{ "error": { "code": string, "message": string } }` |
| Pagination | `?cursor=` / `?limit=` (default 20, max 50) |
| Rate limit | 100/min public; 1000/min authenticated |

### Error codes

| Code | HTTP |
|------|------|
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| INVALID_INPUT | 400 |
| SUBSCRIPTION | 402 |
| INCOMPLETE | 400 (onboarding) |
| EMAIL_TAKEN | 409 |

---

## 8.2 Bureau APIs (shipped)

See [`archive/v1/4-Backend-Schema.md`](../archive/v1/4-Backend-Schema.md) §4.5 for matchmaker endpoints.

Key routes: `/api/auth/login`, `/api/customers`, `/api/customers/[id]/matches`, `/api/matches/send`, `/api/verification/*`, `/api/billing/*`.

---

## 8.3 P1 — Client auth & onboarding (partial shipped)

### `POST /api/client/auth/signup`

**Auth:** Public

```json
{
  "email": "aanya@example.com",
  "firstName": "Aanya",
  "lastName": "Sharma",
  "gender": "female",
  "dateOfBirth": "1995-06-15"
}
```

**Response 200:**

```json
{ "ok": true, "message": "Check your email to verify..." }
```

### `POST /api/client/auth/magic-link`

**Body:** `{ "email": string }`  
**Response:** Always 200 (no email enumeration).

### `POST /api/client/auth/verify`

**Body:** `{ "token": string }`  
**Response:** `{ "ok": true, "redirect": "/portal/onboarding" | "/portal" }`

### `GET /api/client/onboarding`

**Auth:** Client session  
**Response:**

```json
{
  "biodata": { },
  "progress": { "step": 2, "completeness": 64, "minCompleteness": 80, "completed": false },
  "options": { "cities": [], "religions": [] }
}
```

### `PATCH /api/client/onboarding`

**Body:** `{ "step"?: number, "biodata"?: object, "complete"?: boolean }`

---

## 8.4 P2 — Profile self-service (shipped)

### `PATCH /api/client/profile`

Direct field updates; sensitive fields return `{ "pendingRevision": true, "revisionId": "..." }`.

### `GET /api/client/profile/revisions`

List pending/approved changes.

---

## 8.5 P3 — Mutual intro (shipped)

### `GET /api/client/matches`

Extend with `revealLevel`: `limited` | `full`.

### `POST /api/client/matches/[id]/feedback`

**Body:** `{ "decision": "accept" | "decline", "reason"?: string }`  
**Response:** `{ "status": "accepted" | "declined" | "mutual", "mutualMatchId"?: string }`

### `GET /api/client/mutual/[id]`

Full reveal payload after mutual.

---

## 8.6 P4 — C2C chat (shipped)

### `GET /api/c2c/conversations`

List conversations for authenticated client.

### `GET /api/c2c/conversations/[id]/messages?cursor=`

### `POST /api/c2c/conversations/[id]/messages`

**Body:** `{ "body": string }` (max 4000 chars)

### `POST /api/c2c/block`

**Body:** `{ "blockedCustomerId": string }`

---

## 8.7 P5 — Trust (shipped)

### `POST /api/trust/otp/send`

**Body:** `{ "channel": "sms" | "email", "target": string }`

### `POST /api/trust/otp/verify`

**Body:** `{ "attemptId": string, "code": string }`

### `POST /api/trust/report`

**Body:** `{ "targetType": string, "targetId": string, "reason": string }`

---

## 8.8 P6 — Realtime (shipped)

### `GET /api/realtime/config`

**Auth:** Public (no secrets)

**Response:**

```json
{
  "mode": "pusher" | "redis-sse" | "memory-sse" | "poll",
  "pusher": { "key": "...", "cluster": "ap2" } | null
}
```

Mode priority: Pusher (if all `PUSHER_*` + `NEXT_PUBLIC_PUSHER_KEY`) → Redis SSE → in-memory SSE (dev) → poll.

### `POST /api/realtime/pusher/auth`

**Auth:** Client session  
**Body:** Pusher channel auth (`socket_id`, `channel_name`)  
**Channels:** `private-c2c-{conversationId}`, `private-thread-{threadId}`

### `GET /api/c2c/conversations/[id]/stream`

**Auth:** Client session  
**Response:** SSE stream of `C2cRealtimeEvent` (Redis or in-memory bus).

### `GET /api/client/messages/stream`

**Auth:** Client session  
**Response:** SSE stream of `ThreadRealtimeEvent` for matchmaker thread.

**Env:** `REDIS_URL`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `NEXT_PUBLIC_PUSHER_KEY`

---

## 8.9 P7 — Push notifications (shipped)

### `POST /api/client/devices`

**Auth:** Client session  
**Body:** `{ "token": string, "platform": "ios" | "android" | "web" }`  
**Response:** `{ "ok": true, "device": { "id", "platform", "updatedAt" } }`

### `GET /api/client/devices`

Lists registered push tokens (preview only).

### `DELETE /api/client/devices`

**Body:** `{ "token": string }`

### `GET /api/client/notifications/preferences`

**Response:**

```json
{
  "preferences": { "introPush": true, "messagePush": true, "reminderPush": true },
  "dryRun": true,
  "recentDryRun": []
}
```

### `PATCH /api/client/notifications/preferences`

**Body:** `{ "introPush"?: boolean, "messagePush"?: boolean, "reminderPush"?: boolean }`

**Push payload data (all types):** includes `type`, entity ids, `url` (web), `deepLink` (mobile).

**Env:** `PUSH_DRY_RUN`, `EXPO_ACCESS_TOKEN`, `CLIENT_PORTAL_URL`

---

## 8.10 P8 — Mobile client auth (shipped)

### `POST /api/client/auth/token`

**Auth:** Public  
**Body:** `{ "magicToken": string }` — one-time token from magic link email  
**Response:** `{ "ok": true, "token": string, "needsOnboarding": boolean, "client": {...} }`

### `GET /api/client/auth/token`

**Auth:** `Authorization: Bearer` — validates mobile session

### `DELETE /api/client/auth/token`

**Auth:** Bearer — revokes mobile session

All `/api/client/*` routes accept cookie session (web) or Bearer token (mobile).

---

## 8.11 P9 — Discovery (shipped)

### `GET /api/client/discover?city=&ageMin=&ageMax=&religion=&q=&cursor=&limit=`

**Auth:** Client session or Bearer  
**Response:** Ranked pool profiles with **limited reveal** + `interestStatus` if already expressed.

```json
{
  "items": [
    {
      "poolProfileId": "…",
      "score": 82,
      "bucket": "high",
      "verified": true,
      "interestStatus": null,
      "candidate": { "firstName": "…", "age": 28, "city": "Mumbai", "revealLevel": "limited" }
    }
  ],
  "nextCursor": "…",
  "filters": { "cities": [], "religions": [] }
}
```

Excludes: already introduced, blocked, self. Verified profiles receive score boost.

### `POST /api/client/discover/[poolProfileId]/interest`

**Body:** `{ "note"?: string }`  
**Response:** `{ "ok": true, "interest": { "id", "status", "createdAt" } }`  
**Errors:** `429 RATE_LIMIT`, `409 ALREADY_INTRODUCED`, `403` when discovery disabled

Notifies assigned matchmaker via in-app notification. Does **not** open C2C.

---

## 8.12 P10 — Family (shipped)

**Auth:** Client session or Bearer for client routes; delegate session or Bearer for delegate routes.

### `GET /api/family/delegates`

Lists active invites for the signed-in client. Includes `delegateApproverOptIn` and `maxDelegates` (3).

### `POST /api/family/delegates`

**Body:** `{ "email": string, "role": "observer" | "approver" }`  
**Response:** `{ "ok": true, "delegate": { "id", "email", "role", "status", "invitedAt" } }`  
**Errors:** `409 MAX_DELEGATES`, `409 ALREADY_INVITED`, `403 APPROVER_NOT_ALLOWED` (age ≥ 35 without opt-in)

Sends invite email with `/portal/delegate/accept?token=…`.

### `DELETE /api/family/delegates/[id]`

Revokes an invite or accepted delegate.

### `PATCH /api/family/delegates/settings`

**Body:** `{ "delegateApproverOptIn": boolean }` — allows approver role for clients aged 35+.

### `POST /api/family/delegates/accept`

**Body:** `{ "token": string }` — accepts invite, establishes delegate session.

### `POST /api/family/delegate/auth/magic-link`

**Body:** `{ "email": string }` — returning delegate sign-in.

### `GET /api/family/delegate/me`

Delegate profile + client summary (stage, completeness, `canApprove`).

### `GET /api/family/delegate/matches`

Limited-reveal intros for the linked client (contact hidden until mutual + contact share).

### `POST /api/family/delegate/matches/[id]/feedback`

**Body:** `{ "decision": "accept" | "decline", "reason"?: string }`  
**Auth:** Approver delegate only. Logs `AuditEvent` with `actorType: delegate`.

---

## 8.13 P11 — Payments India (shipped)

### `GET /api/client/billing`

Returns current plan, usage, and available tiers (Included / Plus ₹499 / Premium ₹999).

### `POST /api/client/billing/checkout`

**Body:** `{ "plan": "plus" | "premium", "idempotencyKey": string, "gstin"?: string }`  
**Response:** `{ "checkoutUrl", "subscriptionId", "dryRun"?: true }`  
With `RAZORPAY_DRY_RUN=true` (default), checkout activates plan immediately for local dev.

### `GET /api/client/billing/invoices`

GST invoice history.

### `POST /api/client/billing/cancel`

Downgrades to Included.

### `POST /api/client/intro-requests`

**Body:** `{ "note"?: string }` — Plus/Premium only; monthly limit enforced.

### `POST /api/signup/bureau`

**Body:** `{ orgName, slug?, ownerName, username, email, password }`  
Creates org + owner + 14-day trialing subscription. Returns optional `stripeCheckoutUrl`.

---

## 8.15 P12 — Matching v2 + Kundli (shipped)

### `GET/PATCH /api/ops/matching/config`

Ops-only. Toggle `kundliEnabled`, `weightPreset` (`v1`|`v2`), `experimentVariant` (`control`|`treatment`), `mlEnabled`.

### `GET /api/ops/matching/bias-audit`

Returns acceptance rates by religion/caste/city tier with baseline alerts.

### `GET/POST /api/client/astro`

**POST body:** `{ "birthTime": "HH:mm", "birthPlace": string, "consent": true }`  
Fetches/caches Kundli (`KUNDLI_DRY_RUN=true` by default). Requires explicit consent.

### `POST /api/client/preference-signals`

**Body:** `{ "poolProfileId"?, "suggestionId"?, "signalType": "view"|"open"|"dwell", "dwellMs"?: number }`  
Feeds preference-learning weight adjustments.

Feeds preference-learning weight adjustments.

---

## 8.16 P13 — Scheduling & video (shipped)

### `GET /api/client/schedules`

**Auth:** Client session  
**Query:** `?mutualMatchId=` optional filter  
**Response:** `{ items: ScheduledEvent[] }` — mutual-only, active matches.

### `POST /api/client/schedules`

**Body:** `{ mutualMatchId, startsAt (ISO), mode: "video"|"phone"|"in_person", title?, location? }`  
**Rules:** Starts at least 1 hour ahead; in-person requires location.

### `GET/PATCH /api/client/schedules/[id]`

**PATCH body:** `{ action: "accept"|"decline"|"cancel" }`  
On accept for video mode, creates Daily.co room (`VIDEO_DRY_RUN=true` by default).

### `GET /api/client/schedules/[id]/ics`

**Response:** `text/calendar` attachment for accepted events.

---

## 8.17 Webhooks (shipped)

| Path | Provider |
|------|----------|
| `/api/webhooks/resend` | Email events |
| `/api/webhooks/stripe` | Bureau billing |
| `/api/webhooks/razorpay` | Client premium P11 (shipped) |

---

## 8.18 P14 — Analytics & CRM (shipped)

### `GET /api/ops/analytics/funnel`

**Auth:** Ops/owner  
**Response:** `{ steps: FunnelStep[] }` — signup → verified → intro → accepted → mutual → engaged.

### `GET /api/ops/analytics/dashboard?days=7`

**Response:** intros sent, acceptance/mutual rates, avg hours to mutual, clients by stage, recent event counts.

### `GET /api/ops/crm/leads?stage=`

**Response:** `{ items: CrmLead[] }` with customer summary.

### `PATCH /api/ops/crm/leads/[id]`

**Body:** `{ stage?, priority?, notes?, nextFollowUpAt?, assigneeId?, markContacted? }`

### `GET /api/ops/export/customers`

**Response:** CSV attachment of org customer profiles.

### `POST /api/ops/import/customers`

**Body:** `{ csv: string }` or multipart `file` — creates customers, pool mirrors, CRM leads.

---

## Acceptance criteria

- [ ] Each P2–P11 phase adds §8.x section before implementation
- [ ] OpenAPI export optional P16

## Open questions

- GraphQL for mobile efficiency?
