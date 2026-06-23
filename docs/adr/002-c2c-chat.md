# ADR 002: Client-to-Client Chat Stack

**Status:** Accepted (phased)  
**Date:** 2026-06-23

---

## Context

Post-mutual C2C chat (P4) requires realtime delivery, read receipts, and horizontal scaling. Current matchmaker↔client messaging uses polling/SSE patterns, not production-grade C2C.

## Decision

**Phase 1 (P4 MVP):** Server-Sent Events (SSE) + REST for message send; Postgres as source of truth.  
**Phase 2 (P6):** Migrate C2C to **WebSocket** via managed provider (**Pusher Channels** or **Ably**) with Redis pub/sub for multi-instance Next.js.

Matchmaker↔client threads may remain SSE longer; C2C is the scaling driver.

## Consequences

**Positive:** Faster P4 ship; no Redis required day one  
**Negative:** SSE is one-way; typing indicators and presence deferred to P6

## Alternatives considered

| Option | Notes |
|--------|-------|
| Pusher from day one | Higher cost; justified at P6 scale |
| Socket.io self-hosted | Ops burden on small team |
| Firebase Realtime DB | Vendor lock-in; split from Postgres |

## References

- [`17-Realtime-Notifications.md`](../17-Realtime-Notifications.md)
- PRD §P4, §P6
