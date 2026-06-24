# 15. Matching Engine v2

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Status:** Shipped (P12)

---

## 15.1 Baseline (shipped)

- Gender-aware hybrid rules in [`lib/matching/`](../lib/matching/)
- Buckets: High ≥75, Medium 55–74, Low <55
- ML re-rank hook: [`lib/matching/ml-rerank.ts`](../lib/matching/ml-rerank.ts)
- Org weights: `OrgMatchingConfig`

---

## 15.2 Rules v2 additions

| Signal | Weight (default) | Notes |
|--------|------------------|-------|
| Religion / diet | 15% | Hard filter if closed |
| Mother tongue | 12% | |
| Age / height | 15% | Gender-asymmetric |
| Education / income | 15% | |
| Location | 10% | City + relocation P12 |
| Values (kids, pets) | 10% | |
| Kundli compatibility | 15% | P12; disable per org |
| Gotra | Hard filter | Same gotra block |
| ML re-rank | Residual | Trained on outcomes |

---

## 15.3 Kundli integration

Per [ADR 006](adr/006-kundli-integration.md):

- Partner API (Prokerala / AstrologyAPI)
- Cache in `AstroProfile.kundliJson`
- Requires birth time + place (collect in onboarding P12 delta)
- Consent required ([`10-Compliance-Legal.md`](10-Compliance-Legal.md))

---

## 15.4 Location & relocation

- Score boost for same city
- `openToRelocate: Yes` expands city list dynamically
- Future: geo distance if lat/lng captured

---

## 15.5 Production ML

| Stage | Approach |
|-------|----------|
| Training | Weekly Inngest; features from biodata + outcomes |
| Inference | Batch re-rank on intro send; optional online P12.1 |
| Feedback | `MatchSuggestion.status`, C2C message count, mutual |

---

## 15.6 Preference learning

- Implicit: profiles viewed >30s, repeated opens
- Explicit: accept/decline reasons (tags)
- Feed into client-specific weight vector (privacy: not exposed to other clients)

---

## 15.7 Bias audit

Quarterly report:

- Acceptance rate by religion, caste, city tier
- Alert if any group <50% of baseline

---

## 15.8 Discovery vs matchmaker rank

Same core engine; discovery adds:

- Exclude already-introduced
- Boost verified tier
- Rate limit impressions per day (anti-spam)

---

## Scope

Rules v2, Kundli, location, ML production, preference learning, bias audit.

## Acceptance criteria

- [x] Kundli component toggled off by default
- [x] Same-gotra hard filter unit tested
- [x] A/B experiment on weights (doc 13)

## Open questions

- Public score explanation to clients vs matchmaker-only?
