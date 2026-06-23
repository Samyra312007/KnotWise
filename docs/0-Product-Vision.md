# 0. Product Vision

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Companion to:** [`README.md`](README.md), [`1-PRD.md`](1-PRD.md)

---

## 0.1 Positioning

KnotWise is a **hybrid matchmaking platform** for Indian matrimonial bureaus:

- **Human curation first** — matchmakers propose intros with context, scores, and AI-assisted explanations.
- **Client self-serve second** — clients register, complete rich profiles, respond to intros, and (optionally) discover candidates.
- **Not a pure swipe app** — unlike Shaadi/BharatMatrimony self-serve or WhatsApp-only concierge ops.

**One-line:** *The operating system for a modern Indian matchmaking bureau — with a client experience worthy of the people it serves.*

See [ADR 001](adr/001-hybrid-model.md) for the hybrid model decision.

---

## 0.2 Three surfaces

| Surface | Users | Primary jobs |
|---------|-------|--------------|
| **Matchmaker Console** | Riya, Arjun, ops | Triage clients, rank pool, send intros, collaborate, verify |
| **Client Portal (web)** | Aanya, Vikram | Onboard, review intros, mutual opt-in, chat, manage profile |
| **Mobile (Expo)** | Clients + matchmakers | Parity with portal, push, deep links, on-the-go messaging |

---

## 0.3 Competitive frame

| Player | Strength | KnotWise differentiation |
|--------|----------|--------------------------|
| Shaadi / Jeevansathi | Scale, self-serve discovery | Bureau trust + curator quality + verified pool |
| Traditional concierge (TDC today) | Personal touch | Operational tooling + client portal + data trail |
| Bumble/Hinge (India) | UX, chat | Matrimonial depth (family, gotra, Kundli), not casual dating |

---

## 0.4 Business model

**Primary (recommended):** Bureau SaaS subscription (seats + client caps) via Stripe, with **optional client premium** (Razorpay/UPI) for boosted visibility or extra intros.

**Alternates (documented, not v1 default):**

- Success fee on engagement (hard to verify, delayed revenue)
- Freemium client tier with paid verification

Revenue priority: **Bureau SaaS → Client premium → Success fee**.

---

## 0.5 Three-year roadmap (aligned to P1–P16)

| Year | Focus | Phases |
|------|-------|--------|
| Y1 | Client onboarding, mutual intros, trust basics, web portal | P1–P5, P3 |
| Y1–Y2 | C2C chat, realtime, push, mobile v1 | P4, P6–P8 |
| Y2 | Discovery (optional), family delegates, India payments | P9–P11 |
| Y2–Y3 | Kundli, production ML, analytics, compliance, scale | P12–P16 |

---

## 0.6 North-star metrics

| Metric | Definition | Target (directional) |
|--------|------------|----------------------|
| **Intro acceptance rate** | Client accepts matchmaker intro / intros sent | ↑ baseline +10% YoY |
| **Mutual match rate** | Both parties accept / intros accepted | ↑ 25%+ |
| **Time to first intro** | Signup → first matchmaker intro received | ↓ < 7 days |
| **Time to first mutual** | Signup → first mutual unlock | ↓ < 21 days |
| **Client 90-day retention** | Active clients at D90 | ↑ 60%+ |
| **Matchmaker NPS** | Tool satisfaction | ↑ 8/10 |
| **Verification pass rate** | Profiles reaching verified tier | ↑ 85%+ |

---

## 0.7 Explicit deferrals

Not in consumer v2 scope (may revisit post-Y3):

- White-label multi-brand theming per bureau
- International markets beyond India
- In-app advertising
- AI-generated profile photos
- Blockchain / on-chain verification
- Fully automated matching without human intro (auto-send)

---

## 0.8 Acceptance criteria (vision doc)

- [ ] New stakeholder can explain hybrid model in one sentence after reading §0.1
- [ ] Roadmap maps to PRD P1–P16 without orphan features
- [ ] Metrics in §0.6 appear in [`13-Analytics-Metrics.md`](13-Analytics-Metrics.md)

## 0.9 Open questions

- Success fee legal structure in India matrimonial context?
- Single global brand vs per-bureau white-label for enterprise bureaus?
