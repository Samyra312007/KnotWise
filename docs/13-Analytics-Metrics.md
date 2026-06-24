# 13. Analytics and Metrics

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Phase:** P14

---

## 13.1 North-star metrics

See [`0-Product-Vision.md`](0-Product-Vision.md) §0.6.

---

## 13.2 Event taxonomy

| Event | Properties | Phase |
|-------|------------|-------|
| `client.signup_started` | orgId | P1 |
| `client.signup_completed` | orgId | P1 |
| `client.onboarding_step` | step, completeness | P1 |
| `client.onboarding_completed` | completeness | P1 |
| `intro.viewed` | suggestionId | P3 |
| `intro.accepted` | suggestionId | P3 |
| `intro.declined` | suggestionId, reason | P3 |
| `mutual.created` | mutualMatchId | P3 |
| `c2c.message_sent` | conversationId | P4 |
| `discovery.interest` | poolProfileId | P9 |
| `verification.tier_up` | tier | P5 |
| `subscription.client_purchased` | plan | P11 |

PII rule: never send phone/email in analytics payloads — use hashed IDs.

---

## 13.3 Funnels

```mermaid
flowchart LR
    Signup --> Verified
    Verified --> FirstIntro
    FirstIntro --> Accepted
    Accepted --> Mutual
    Mutual --> Engaged
```

**Engaged** = 5+ C2C messages or scheduled date (P13).

---

## 13.4 Matchmaker dashboards (P14)

| Widget | Metric |
|--------|--------|
| Active clients | count by stage |
| Intros sent (7d) | count |
| Acceptance rate | accepted / sent |
| Mutual rate | mutual / accepted |
| Avg time to mutual | hours |

Route: `/ops/analytics` or embed in existing ops dashboard.

---

## 13.5 A/B testing (P12)

- Feature flags via `OrgMatchingConfig` or LaunchDarkly
- Experiments: weight presets, explanation tone, intro card layout
- Primary metric: intro acceptance rate; guardrail: decline rate

---

## 13.6 CRM leads (P14)

- Lead = signup without completed onboarding or without payment
- Stages: lead → qualified → paying client
- Matchmaker tasks: follow up incomplete profiles

---

## Scope

Events, funnels, dashboards, experiments, lead CRM.

## Acceptance criteria

- [x] Funnel dashboard live for ops
- [x] All P3+ UI actions emit events

## Open questions

- PostHog vs Amplitude vs self-hosted?
