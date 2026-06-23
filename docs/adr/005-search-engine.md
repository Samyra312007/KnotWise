# ADR 005: Search Engine

**Status:** Accepted  
**Date:** 2026-06-23

---

## Context

P9 discovery needs search/filter over pool profiles. Team size favors minimal infra.

## Decision

**Phase 1 (P9):** PostgreSQL full-text search (`tsvector` on biodata JSON extract + indexed columns: city, religion, gender, age).  
**Phase 2 (scale):** Re-evaluate Elasticsearch/OpenSearch if >500k profiles per org or sub-200ms search SLO fails.

Discovery feed ranking reuses [`15-Matching-Engine-v2.md`](../15-Matching-Engine-v2.md) scores, not search relevance alone.

## Consequences

**Positive:** No new service for P9 MVP  
**Negative:** Complex JSON queries may need materialized views

## References

- PRD §P9
- [`4-Backend-Schema.md`](../4-Backend-Schema.md) §P9
