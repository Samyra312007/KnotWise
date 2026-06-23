# ADR 001: Hybrid Product Model

**Status:** Accepted  
**Date:** 2026-06-23  
**Deciders:** Product, Engineering

---

## Context

KnotWise can evolve as (a) pure bureau ops tool, (b) pure self-serve dating app, or (c) hybrid. Indian matrimonial market values human curation; clients also expect modern self-serve profile and response flows.

## Decision

**Hybrid model:** Matchmaker-curated intros remain the **primary** path to first contact. Self-serve discovery (browse/search/swipe) is **optional** and ships in P9, secondary to intros.

## Consequences

**Positive**

- Differentiates from Shaadi (no curator) and WhatsApp bureaus (no tooling)
- Matchmakers retain control of quality and narrative
- Client portal adds stickiness without replacing curator role

**Negative**

- P9 discovery may feel delayed for users expecting immediate swipe UX
- Two ranking surfaces (matchmaker rank vs discovery feed) need consistent scoring

## Alternatives considered

| Option | Rejected because |
|--------|------------------|
| Bureau-only | No consumer growth; clients churn to self-serve platforms |
| Self-serve first | Undermines bureau SaaS value prop and trust positioning |

## References

- [`0-Product-Vision.md`](../0-Product-Vision.md) §0.1
- PRD §P3, §P9
