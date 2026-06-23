# ADR 006: Kundli Integration

**Status:** Proposed (default path selected)  
**Date:** 2026-06-23

---

## Context

P12 requires horoscope/Kundli matching. Building full Vedic astrology engine in-house is high effort.

## Decision

**Partner API first:** Integrate **Prokerala** or **AstrologyAPI** (evaluate on cost, SLA, gotra/manglik fields).  
Cache Kundli JSON on `Customer` / `PoolProfile` extension table `AstroProfile`.  
**Build vs buy threshold:** Build in-house only if API cost > ₹X/month at scale (TBD in P12 spike).

Algorithm: Kundli compatibility as **weighted score component** (default 15% of total); bureau can disable via `OrgMatchingConfig`.

## Consequences

**Positive:** Time to market  
**Negative:** Vendor dependency; PII (birth time/place) sent to third party — DPDP consent required

## References

- [`15-Matching-Engine-v2.md`](../15-Matching-Engine-v2.md)
- [`10-Compliance-Legal.md`](../10-Compliance-Legal.md)
