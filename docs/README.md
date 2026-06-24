# KnotWise Documentation Index

**Version:** Consumer v2.0  
**Status:** Active  
**Supersedes:** [`archive/v1/`](archive/v1/) (MVP matchmaker-only specs)

---

## Reading order (new engineers)

1. [`0-Product-Vision.md`](0-Product-Vision.md) — what KnotWise is becoming
2. [`7-Glossary-and-Personas.md`](7-Glossary-and-Personas.md) — terms, personas, permission matrix
3. [`1-PRD.md`](1-PRD.md) — product requirements (bureau + consumer P1–P16)
4. [`3-Application-Flow.md`](3-Application-Flow.md) — journeys and state machines
5. [`4-Backend-Schema.md`](4-Backend-Schema.md) — data model and migrations
6. [`8-API-Contracts.md`](8-API-Contracts.md) — API reference
7. [`5-Implementation-Plan.md`](5-Implementation-Plan.md) — build phases and checklists
8. Domain docs [`9`](9-Trust-and-Safety.md)–[`17`](17-Realtime-Notifications.md) as needed
9. [`adr/`](adr/) — architecture decisions before implementing forks

---

## Version matrix

| Era | Scope | Doc location | Code status |
|-----|-------|--------------|-------------|
| MVP v1 | Matchmaker console only | [`archive/v1/`](archive/v1/) | Shipped |
| Post-MVP bureau | Org/RBAC, portal, email, billing hooks, ops, verification, chat | PRD Part A, Impl Plan §8–20 | Shipped |
| Consumer P1 | Self-signup + onboarding wizard | PRD §P1 | Shipped |
| Consumer P2 | Profile self-service | PRD §P2, Flow §II.8, Schema §P2 | Shipped |
| Consumer P3 | Mutual intro machine | PRD §P3, Flow §II.2–3, Schema §P3 | Shipped |
| Consumer P4 | C2C chat | PRD §P4, ADR 002 | Shipped |
| Consumer P5 | Trust & verification | PRD §P5, doc 9, ADR 003 | Shipped |
| Consumer P6 | Realtime messaging | PRD §P6, doc 17, ADR 002 | Shipped |
| Consumer P7 | Push notifications | PRD §P7, doc 17, doc 14 | Shipped |
| Consumer P8 | Mobile app v1 | PRD §P8, doc 14 | Shipped |
| Consumer P9 | Discovery feed | PRD §P9, ADR 001/005 | Shipped |
| Consumer P10–P16 | Real dating/matrimonial product | PRD §P10–P16, docs 8–17 | Spec only |

---

## Implementation status (honest snapshot)

| Layer | Status |
|-------|--------|
| Matchmaker console + match engine | Shipped |
| Post-MVP bureau (org/RBAC, email, billing hooks, ops, verification queue, matchmaker↔client chat, uploads) | Shipped |
| P1 self-signup + onboarding wizard | Shipped (`app/portal/signup`, `app/api/client/onboarding`) |
| P2 profile self-service | Shipped (`app/portal/profile/edit`, ops profile queue) |
| P3 mutual intro machine | Shipped (`app/portal/matches`, `MutualMatch`) |
| P4 C2C chat | Shipped (`app/portal/chat`, `app/api/c2c/*`) |
| P5 trust & verification | Shipped (`app/portal/trust`, MSG91 OTP, reports) |
| P6 realtime messaging | Shipped (`lib/realtime/*`, Pusher + Redis + SSE) |
| P7 push notifications | Shipped (`lib/push/*`, Expo, device tokens, preferences) |
| P8 mobile app v1 | Shipped (`apps/mobile/`, client bearer auth, Expo Router) |
| P9 discovery feed | Shipped (`/portal/discover`, `lib/discovery/*`) |
| P10–P16 consumer features | Spec only (this library) |

---

## Gate rule

No new **consumer** feature code ships without these artifacts for that phase marked **Approved**:

- PRD slice (§Pn in [`1-PRD.md`](1-PRD.md))
- Application flow (§Pn in [`3-Application-Flow.md`](3-Application-Flow.md))
- Schema delta (§Pn in [`4-Backend-Schema.md`](4-Backend-Schema.md))
- API contracts (§Pn in [`8-API-Contracts.md`](8-API-Contracts.md))
- Implementation checklist (§Pn in [`5-Implementation-Plan.md`](5-Implementation-Plan.md))

---

## Document map

| # | Document | Purpose |
|---|----------|---------|
| 0 | [`0-Product-Vision.md`](0-Product-Vision.md) | Positioning, roadmap, metrics, deferrals |
| 1 | [`1-PRD.md`](1-PRD.md) | Product requirements |
| 2 | [`2-TRD.md`](2-TRD.md) | Technical requirements |
| 3 | [`3-Application-Flow.md`](3-Application-Flow.md) | User journeys, diagrams |
| 4 | [`4-Backend-Schema.md`](4-Backend-Schema.md) | Prisma, types, migrations |
| 5 | [`5-Implementation-Plan.md`](5-Implementation-Plan.md) | Phases, checklists |
| 6 | [`6-Frontend-Design-Prompts.md`](6-Frontend-Design-Prompts.md) | UI/UX specs |
| 7 | [`7-Glossary-and-Personas.md`](7-Glossary-and-Personas.md) | Terms and personas |
| 8 | [`8-API-Contracts.md`](8-API-Contracts.md) | REST API reference |
| 9 | [`9-Trust-and-Safety.md`](9-Trust-and-Safety.md) | Verification, moderation |
| 10 | [`10-Compliance-Legal.md`](10-Compliance-Legal.md) | DPDP, legal, consent |
| 11 | [`11-Infrastructure-Deployment.md`](11-Infrastructure-Deployment.md) | Hosting, CI/CD, ops |
| 12 | [`12-Testing-Strategy.md`](12-Testing-Strategy.md) | Test pyramid, GWT |
| 13 | [`13-Analytics-Metrics.md`](13-Analytics-Metrics.md) | Events, funnels, dashboards |
| 14 | [`14-Mobile-App-Spec.md`](14-Mobile-App-Spec.md) | Expo, stores, push |
| 15 | [`15-Matching-Engine-v2.md`](15-Matching-Engine-v2.md) | Rules, Kundli, ML |
| 16 | [`16-Payments-Billing.md`](16-Payments-Billing.md) | Stripe, Razorpay, tiers |
| 17 | [`17-Realtime-Notifications.md`](17-Realtime-Notifications.md) | WebSocket, push, SMS |

| ADR | Document |
|-----|----------|
| 001 | [`adr/001-hybrid-model.md`](adr/001-hybrid-model.md) |
| 002 | [`adr/002-c2c-chat.md`](adr/002-c2c-chat.md) |
| 003 | [`adr/003-otp-provider.md`](adr/003-otp-provider.md) |
| 004 | [`adr/004-payments-primary.md`](adr/004-payments-primary.md) |
| 005 | [`adr/005-search-engine.md`](adr/005-search-engine.md) |
| 006 | [`adr/006-kundli-integration.md`](adr/006-kundli-integration.md) |
| 007 | [`adr/007-family-delegate-model.md`](adr/007-family-delegate-model.md) |

---

## Gap cross-reference matrix

Every remaining consumer-dating gap maps to a phase and primary doc.

### Core product

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Client self-registration + full profile onboarding | P1 | PRD §P1, Flow §II.1, Schema §P1 | Shipped |
| Client-side profile editing without matchmaker approval | P2 | PRD §P2, Flow §II.8, Schema §P2 | Shipped |
| Direct client-to-client discovery (browse/search/swipe) | P9 | PRD §P9, Flow §II.5, ADR 001 | Shipped |
| Direct client-to-client chat after mutual interest | P4 | PRD §P4, doc 17, ADR 002 | Shipped |
| Coordinated intro: mutual opt-in → contact reveal | P3 | PRD §P3, Flow §II.2–3, Schema §P3 | Shipped |
| In-app or integrated video / voice calls | P13 | PRD §P13, Flow §II.7 | Spec |
| Date scheduling and reminders | P13 | PRD §P13, Schema §P13 | Spec |
| Family / guardian accounts | P10 | PRD §P10, ADR 007 | Spec |

### Trust & safety

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Phone / email OTP at production quality | P5 | doc 9, ADR 003 | Shipped |
| Government ID / KYC verification | P5 | doc 9, Schema §P5 | Shipped |
| Photo authenticity checks | P5 | doc 9 | Shipped (ops review) |
| Block, report, moderation tools | P5 | doc 9, Schema §P5 | Shipped |
| Content filtering for chat and profiles | P5 | doc 9 | Shipped |
| Gotra / same-gotra hard rules | P5, P12 | doc 9, doc 15 | Shipped |

### Matching & intelligence

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Real horoscope / Kundli integration | P12 | doc 15, ADR 006 | Spec |
| Location-aware and relocation-aware matching | P12 | doc 15 | Spec |
| Learned ranking at production scale | P12 | doc 15, TRD §2.12 | Spec |
| A/B testing and acceptance-rate analytics | P12, P14 | doc 13, doc 15 | Spec |
| Preference learning from behavior | P12 | doc 15 | Spec |

### Payments & business

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Client subscription / premium tiers | P11 | doc 16, ADR 004 | Spec |
| UPI / India-local payments (Razorpay) | P11 | doc 16 | Spec |
| Self-serve bureau signup (multi-tenant SaaS) | P11 | doc 16, PRD §P11 | Spec |
| Invoicing, refunds, tax handling | P11 | doc 16 | Spec |

### Mobile & notifications

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Production iOS/Android apps | P8 | doc 14 | Shipped |
| Push notifications | P7 | doc 17 | Shipped |
| Deep links and app install flows | P7, P8 | doc 14, doc 17 | Shipped (P7) |

### Realtime & scale

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| True realtime messaging | P6 | doc 17, ADR 002 | Shipped |
| Production PostgreSQL hosting, backups, monitoring | P16 | doc 11 | Spec |
| CDN for photos/videos | P16 | doc 11, TRD §2.10 | Spec |
| Email/SMS at scale + bounce handling | P16 | doc 17 | Spec |
| Rate limiting, abuse prevention, audit compliance | P16 | doc 9, doc 11 | Spec |

### Media & profiles

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Multiple photos, albums, video intros | P2 | PRD §P2, Schema §P2 | Shipped (photos; video P2+) |
| Profile completeness scoring and nudges | P1, P2 | PRD §P1–P2 | Shipped (P1) |
| Verification badges visible to clients | P5 | doc 9, doc 6 §6.16 | Shipped |

### Ops & analytics

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Matchmaker performance dashboards | P14 | doc 13 | Spec |
| Funnel metrics (signup → engaged) | P14 | doc 13 | Spec |
| CRM for leads | P14 | PRD §P14 | Spec |
| Bulk import/export of profiles | P14 | PRD §P14 | Spec |
| Multi-bureau / white-label support | Deferred | doc 0 §deferrals | Deferred |

### Legal & compliance

| Gap | Phase | Primary doc | Status |
|-----|-------|-------------|--------|
| Terms, privacy policy, consent flows | P15 | doc 10 | Spec |
| Data export / account deletion | P15 | doc 10 | Spec |
| Age verification and minor protection | P5, P15 | doc 9, doc 10 | Spec |
| Regional compliance (India DPDP) | P15 | doc 10 | Spec |

### Already shipped (not remaining)

| Capability | Primary doc |
|------------|-------------|
| Matchmaker console, ranked suggestions, send-match, notes, stages | PRD Part A, archive/v1 |
| Client portal (login, view intros, accept/decline, message matchmaker) | PRD Part C |
| Org/RBAC, verification queue, billing hooks, email/upload scaffolding | PRD Part A, Impl §8–20 |

---

## Authoring rules

1. Extend, don't fork — v1 lives in [`archive/v1/`](archive/v1/); v2 is canonical.
2. One feature = five artifacts: PRD → Flow → Schema → API → Implementation checklist.
3. Diagrams required: ≥1 mermaid flow per journey; ≥1 sequence diagram per external integration.
4. India-first defaults: UPI/Razorpay, family accounts, manglik/gotra, DPDP.
5. No implementation code in docs except Prisma snippets, JSON examples, state tables.
