# 3. Application Flow

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Supersedes:** [`archive/v1/3-Application-Flow.md`](archive/v1/3-Application-Flow.md)

### Changelog v2.0

- Part I updated for post-MVP bureau routes
- Part II added: consumer journeys P1–P13
- Global state machine linking Customer, MatchSuggestion, MutualMatch

---

## Part I — Matchmaker bureau

### I.1 Top-level journey (updated)

```mermaid
flowchart TD
    Login["/login"] --> Dashboard["/dashboard"]
    Dashboard --> Detail["/customers/:id"]
    Detail --> OpsLink["/ops optional"]
    Dashboard --> Billing["/settings/billing"]
    Detail --> SendIntro["Send Match modal"]
    SendIntro --> EmailPipeline["Email queued / sent"]
```

### I.2 Routes (shipped)

| Route | Purpose |
|-------|---------|
| `/login` | Matchmaker auth |
| `/dashboard` | Customer manifest |
| `/customers/:id` | Dossier: biodata, matches, notes, messages |
| `/ops` | Verification queue, ops dashboard |
| `/settings/billing` | Stripe checkout/portal |

See [`archive/v1/3-Application-Flow.md`](archive/v1/3-Application-Flow.md) for page-level MVP detail (still valid for bureau tabs).

---

## Part II — Consumer portal

### II.1 Signup → verify → onboarding (P1)

```mermaid
sequenceDiagram
    participant U as User
    participant S as /portal/signup
    participant API as /api/client/auth/signup
    participant E as Email
    participant V as /portal/verify
    participant O as /portal/onboarding

    U->>S: name, email, gender, DOB
    S->>API: POST signup
    API->>E: magic link
    U->>E: click link
    E->>V: token
    V->>API: POST verify
    API-->>U: session cookie
    V->>O: redirect if incomplete
    U->>O: 7-step wizard
    O->>API: PATCH onboarding
    API-->>U: stage Active, verification case
```

**Pages:** `/portal/signup`, `/portal/login`, `/portal/verify`, `/portal/onboarding`  
**APIs:** `POST /api/client/auth/signup`, `POST /api/client/auth/magic-link`, `POST /api/client/auth/verify`, `GET/PATCH /api/client/onboarding`

---

### II.2 Receive intro → limited reveal (P3)

```mermaid
flowchart LR
    IntroSent["Matchmaker sends intro"] --> ClientNotified["Client notified P7"]
    ClientNotified --> ViewIntro["/portal/matches/:id"]
    ViewIntro --> LimitedReveal["Photo, first name, city, score headline"]
    LimitedReveal --> Decision{Accept or decline?}
    Decision -->|Decline| Declined["MatchSuggestion declined"]
    Decision -->|Accept| AwaitingOther["Awaiting other party"]
```

**Limited reveal fields:** firstName, age, city, photo, 2-line bio, compatibility score bucket — no phone, email, company, gotra.

---

### II.3 Mutual unlock → full reveal → C2C (P3 + P4)

```mermaid
sequenceDiagram
    participant A as ClientA
    participant S as Server
    participant B as ClientB

    A->>S: POST accept intro
    S->>S: MatchSuggestion status accepted_A
    B->>S: POST accept intro
    S->>S: Create MutualMatch
    S->>A: full reveal + chat unlocked
    S->>B: full reveal + chat unlocked
    A->>S: POST /api/c2c/messages
    S->>B: realtime delivery P6
```

Optional contact share: client toggles "Share my phone" after mutual.

---

### II.4 Family delegate (P10)

```mermaid
flowchart TD
    ClientInvite["Client invites delegate email"] --> DelegateVerify["Delegate magic link + OTP"]
    DelegateVerify --> DelegateDash["/portal/delegate/:clientId"]
    DelegateDash --> ApproveDecline["Approve/decline intro on behalf"]
    ApproveDecline --> AuditLog["AuditEvent logged"]
```

See [ADR 007](adr/007-family-delegate-model.md).

---

### II.5 Discovery feed (P9, optional)

```mermaid
flowchart LR
    Feed["/portal/discover"] --> Filter["Filters: city, age, religion"]
    Filter --> RankedList["Scored pool profiles"]
    RankedList --> ExpressInterest["Express interest"]
    ExpressInterest --> MMQueue["Matchmaker notified to formal intro"]
```

Hybrid: express interest does **not** auto-open C2C; matchmaker may send formal intro.

---

### II.6 Push & deep links (P7)

| Event | Deep link |
|-------|-----------|
| New intro | `knotwise://portal/matches/:id` |
| New C2C message | `knotwise://portal/chat/:conversationId` |
| Verification approved | `knotwise://portal/profile` |

---

### II.7 Video & scheduling (P13)

```mermaid
sequenceDiagram
    participant A as ClientA
    participant S as Server
    participant Cal as Calendar API
    participant V as Video provider

    A->>S: POST schedule proposal
    S->>B: push notification
    B->>S: accept slot
    S->>Cal: ICS / Google Calendar link
    S->>V: create room link
    S->>A: reminder 1h before
```

---

### II.8 Profile self-edit (P2)

`/portal/profile/edit` — section tabs; sensitive fields → moderation queue.

---

## Global state machine

```mermaid
stateDiagram-v2
    state CustomerStage {
        Onboarding --> Active
        Active --> MatchSent
        MatchSent --> InConversation
        InConversation --> ClosedEngaged
    }

    state MatchSuggestionStatus {
        shortlisted --> sent
        sent --> viewed
        viewed --> accepted
        viewed --> declined
        accepted --> mutual: both accepted
    }

    state MutualMatchStatus {
        [*] --> active
        active --> contact_shared
        active --> closed
    }
```

| Entity | Field | Values |
|--------|-------|--------|
| Customer | `stage` | Onboarding, Active, Match Sent, In Conversation, Paused, Closed * |
| MatchSuggestion | `status` | shortlisted, sent, viewed, accepted, declined, mutual |
| MutualMatch | `status` | active, contact_shared, closed |

---

## Error & empty states (consumer)

| Screen | Empty | Error |
|--------|-------|-------|
| Onboarding | n/a | "Could not save. Retry." |
| Matches | "No introductions yet." | "Could not load." |
| C2C chat | "Say hello." | "Message failed." |
| Discover P9 | "No profiles match filters." | "Search unavailable." |

---

## Acceptance criteria

- [ ] Every P1–P13 journey has mermaid diagram in this doc
- [ ] State machine matches Schema §global

## Open questions

- Auto-transition Customer.stage on mutual vs manual matchmaker update?
