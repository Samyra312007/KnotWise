# 1. Product Requirements Document (PRD)

**Project:** KnotWise — Hybrid Matchmaking Platform  
**Version:** 2.0  
**Status:** Approved  
**Supersedes:** [`archive/v1/1-PRD.md`](archive/v1/1-PRD.md)

### Changelog v2.0

- Added Consumer product phases P1–P16
- Retired MVP non-goals N1–N8 (shipped or re-scoped)
- Documented post-MVP bureau baseline (Part A)
- Added shipped inventory (Part C)

---

## Part A — Bureau platform (shipped baseline)

### A.1 Background

KnotWise started as the **TDC Matchmaker Dashboard** — operational tooling for human-curated Indian matchmaking. Post-MVP expanded to multi-tenant PostgreSQL, client portal, email, billing hooks, ops, and collaboration.

### A.2 Bureau goals (shipped)

| ID | Goal | Status |
|----|------|--------|
| G1 | Matchmaker login; scoped customer list | Shipped |
| G2 | Full biodata + ranked pool matches + AI explanations | Shipped |
| G3 | Send Match with email pipeline + audit log | Shipped |
| G4 | Notes, stages, collaboration, handoffs | Shipped |
| G5 | Org/RBAC, verification queue, billing gates | Shipped |
| G6 | Client portal: login, intros, feedback, matchmaker chat | Shipped |

### A.3 Retired non-goals (MVP N1–N8)

| Old non-goal | v2 status |
|--------------|-----------|
| N1 Client-facing app | Shipped (portal + P1 signup) |
| N2 Real email | Shipped (Resend + dry-run) |
| N3 Payments | Hooks shipped; consumer tiers P11 |
| N4 Collaboration | Shipped |
| N5 Verification workflow | Shipped (ops queue) |
| N6 Client↔match chat | Shipped (matchmaker thread) |
| N7 Mobile-native | Scaffold shipped; P8 production |
| N8 Real Kundli | P12 |

### A.4 Bureau user stories (retained)

See [`archive/v1/1-PRD.md`](archive/v1/1-PRD.md) §1.5 US-01–US-10. All acceptance criteria met in production codebase.

---

## Part B — Consumer product phases

Each phase: **Problem → Stories → Goals / Non-goals → Acceptance → Metrics**

---

### P1 — Client onboarding v2

**Problem:** Clients cannot join without matchmaker pre-creating accounts; profiles incomplete.

**Stories**

- Given I am a new user, when I sign up at `/portal/signup`, then I receive a verification email and can complete a multi-step wizard.
- Given I am mid-onboarding, when I return, then I resume at my last step with saved data.
- Given my profile reaches 80% completeness, when I finish the wizard, then my stage moves to Active and a verification case is created.

**Goals:** Self-registration; 7-step wizard; completeness score; auto matchmaker assignment.  
**Non-goals:** OTP phone verify (P5); multi-photo upload (P2).

**Acceptance**

- [x] Signup API creates Customer + ClientAccount
- [x] Onboarding wizard with completeness gate
- [x] UploadThing photo upload in wizard
- [x] Step-by-step validation
- [ ] Phone OTP on signup (P5)
- [x] Onboarding analytics events (P14)

**Metrics:** Signup completion rate; median time to 80% profile.

**Status:** Shipped — see [`5-Implementation-Plan.md`](5-Implementation-Plan.md) §P1.

---

### P2 — Profile self-service

**Problem:** Clients submit text "change requests"; no direct edit of photos, bio, preferences.

**Stories**

- Given I am a verified client, when I edit my bio or preferences, then changes apply immediately for non-sensitive fields.
- Given I change religion/caste/photo, when I save, then a moderation queue entry is created and previous value shown until approved.

**Goals:** Direct edit UI; `ProfileRevision` workflow; multi-photo albums (UploadThing).  
**Non-goals:** Public profile URL.

**Acceptance:** Edit screens for all biodata sections; ops approve/reject; audit trail.

**Metrics:** Time to apply approved change; moderation queue SLA.

**Status:** Shipped

---

### P3 — Mutual intro machine

**Problem:** Accept/decline on intros exists but no mutual unlock, limited reveal, or contact gating.

**Stories**

- Given a matchmaker sent me an intro, when I open it, then I see limited reveal only.
- Given I accept, when the other party accepts, then mutual unlock opens full biodata and C2C chat eligibility.

**Goals:** State machine `introduced → viewed → accepted → declined → mutual`; `MutualMatch` entity.  
**Non-goals:** Auto-intro without matchmaker (hybrid model).

**Acceptance:** Limited/full reveal enforced server-side; both sides must accept; contact reveal configurable.

**Metrics:** Mutual rate; time intro → mutual.

**Status:** Shipped — [ADR 001](adr/001-hybrid-model.md)

---

### P4 — Client-to-client chat

**Problem:** Only matchmaker↔client messaging exists.

**Stories**

- Given a mutual match, when I open chat, then I can message the other client with delivery under 5s (P6).
- Given I block a user, when they message, then delivery fails and report is available.

**Goals:** C2C `Conversation` separate from matchmaker `Thread`; read receipts (P6).  
**Non-goals:** Group chat.

**Acceptance:** Chat UI in portal; block/report hooks; message history persisted.

**Metrics:** Messages per mutual match; response time.

**Status:** Shipped — [ADR 002](adr/002-c2c-chat.md)

---

### P5 — Trust & verification (production)

**Problem:** Ops checklist only; no OTP, KYC, photo authenticity, gotra enforcement.

**Stories**

- Given I verify my phone, when OTP is correct, then my profile shows phone-verified badge.
- Given same gotra is configured as hard filter, when matchmaker sends intro, then system warns or blocks.

**Goals:** MSG91 OTP; ID upload + manual/AI photo review; block/report; content filter.  
**Non-goals:** Automated government API (use manual review v1).

**Acceptance:** Tier badges visible; gotra rule in rank engine; report triage in ops.

**Metrics:** Verification pass rate; report resolution time.

**Status:** Shipped — [ADR 003](adr/003-otp-provider.md)

---

### P6 — Realtime infrastructure

**Problem:** Polling/SSE insufficient for C2C at scale.

**Goals:** WebSocket (Pusher/Ably); Redis; presence optional.  
**Acceptance:** p95 message delivery <2s at 1k concurrent connections.

**Status:** Shipped — Pusher + Redis + SSE fallback (`lib/realtime/`)

---

### P7 — Push notifications

**Goals:** FCM/APNs; device tokens; preferences; deep links to intro/chat.  
**Acceptance:** Push on new intro, message, reminder; opt-out per category.

**Status:** Shipped — Expo push API, `DeviceToken`, portal notification settings

---

### P8 — Mobile app v1

**Goals:** Store-ready Expo app; portal parity; secure token storage.  
**Acceptance:** TestFlight/Play Internal; login, intros, chat, profile.

**Status:** Shipped — `apps/mobile/` Expo Router app with bearer auth

---

### P9 — Discovery (optional, hybrid secondary)

**Problem:** Clients cannot browse pool themselves.

**Goals:** Curated feed + search (Postgres FTS); swipe or list UX; same scoring as matchmaker rank.  
**Non-goals:** Primary path over matchmaker intros.

**Acceptance:** Feed respects verification tier; rate limits; no contact without mutual path.

**Status:** Shipped — hybrid discovery feed with matchmaker interest queue

---

### P10 — Family delegates

**Goals:** Invite observer/approver delegates; audit actions.  
**Acceptance:** Delegate login; permission matrix per [ADR 007](adr/007-family-delegate-model.md).

**Status:** Shipped — family delegate invites, delegate portal, observer/approver roles, audit trail

---

### P11 — Payments India

**Goals:** Razorpay client premium; bureau self-serve signup; GST invoices.  
**Acceptance:** UPI checkout; webhook entitlement; feature gates.

**Status:** Shipped — Razorpay client premium, bureau self-serve signup, GST invoices, plan feature gates

---

### P12 — Matching v2 + Kundli

**Goals:** Kundli API; location/relocation scoring; production ML; A/B tests; preference learning.  
**Acceptance:** Configurable weights; bias audit report; experiment framework.

**Status:** Shipped — Kundli integration, matching v2 weights, preference learning, A/B experiments, bias audit

---

### P13 — Scheduling & video

**Goals:** Date scheduling; calendar export; optional video link (Daily.co / Zoom).  
**Acceptance:** Reminders via push/email; mutual-only scheduling.

**Status:** Shipped — date proposals, ICS export, Daily.co video (dry-run default), push/email reminders

---

### P14 — Analytics & ops CRM

**Goals:** Funnels; matchmaker dashboards; lead CRM; CSV import/export.  
**Acceptance:** Signup → verified → intro → mutual → engaged dashboard.

**Status:** Shipped — funnel dashboard, matchmaker metrics, CRM leads, CSV import/export, product event tracking

---

### P15 — Compliance hardening

**Goals:** ToS/Privacy; consent flows; export/delete; age gate; DPDP.  
**Acceptance:** Legal pages; data export API; deletion within 30 days.

**Status:** Spec — [`10-Compliance-Legal.md`](10-Compliance-Legal.md)

---

### P16 — Production scale

**Goals:** CDN; backups; monitoring; rate limits; email bounce handling.  
**Acceptance:** Runbooks; p95 API SLO; load test report.

**Status:** Spec — [`11-Infrastructure-Deployment.md`](11-Infrastructure-Deployment.md)

---

## Part C — Shipped today (code pointers)

| Capability | Location |
|------------|----------|
| Matchmaker console | `app/(app)/`, `app/api/customers/` |
| Match engine | `lib/matching/` |
| Send match + email | `app/api/matches/send/`, `lib/jobs/email-jobs.ts` |
| Client portal | `app/portal/` |
| Client signup/onboarding | `app/portal/signup`, `app/api/client/onboarding` |
| Magic link auth | `app/api/client/auth/` |
| Matchmaker↔client chat | `app/api/client/messages`, `Thread` model |
| Ops + verification | `app/(app)/ops/`, `VerificationCase` |
| Stripe bureau billing | `lib/billing/`, `app/api/billing/` |
| Uploads | `app/api/uploadthing/` |
| Mobile scaffold | `apps/mobile/` |

---

## Open questions (PRD-level)

- P9 discovery launch criteria (% bureaus opting in)?
- Client premium pricing tiers for India market?
