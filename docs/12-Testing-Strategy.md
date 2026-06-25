# 12. Testing Strategy

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved

---

## 12.1 Test pyramid

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Matching engine, completeness, pure lib |
| Integration | Vitest + PostgreSQL | API route handlers with Prisma |
| E2E | Playwright | Critical portal journeys |
| Load | k6 (P16) | Health, OpenAPI |

---

## 12.2 Current coverage

**Unit** (`tests/*.test.ts`) — 100+ tests across matching, trust, scheduling, compliance, scale, token hashing, intro feedback normalization.

**Integration** (`tests/integration/*.integration.test.ts`) — runs when `DATABASE_URL` is reachable; skipped locally if Postgres is down:

- Client auth (magic link + verify + `/api/client/me`)
- Mutual intro (both accept → `MutualMatch`)
- C2C chat (send message + non-participant 404)
- IDOR (client cannot accept another client's intro)
- Billing (Razorpay dry-run checkout)
- Smoke: matchmaker bureau + client portal API paths

**E2E** (`e2e/portal-mutual-chat.spec.ts`) — two browser contexts, verify → accept → chat link.

Run:

```bash
npm test
npm run test:e2e   # requires DATABASE_URL + dev server (started automatically)
```

---

## 12.3 GWT examples

### P3 Mutual intro

**Given** client A accepted intro **When** client B accepts **Then** `MutualMatch` created and both see full reveal.

### P5 OTP

**Given** valid phone **When** 3 wrong codes **Then** 429 rate limit.

### P4 C2C

**Given** mutual match **When** A sends message **Then** B receives within 2s (P6 load test).

---

## 12.4 Fixtures

- `tests/fixtures.ts` — sample biodata pairs
- `tests/integration/helpers/fixtures.ts` — isolated org + client pairs for integration tests
- `e2e/global-setup.ts` — Playwright seed data + magic-link tokens

---

## 12.5 CI gates

- PR: typecheck + unit + integration (Postgres service)
- Optional: Playwright E2E when DB available
- Release: load test report attached

---

## 12.6 Security tests

- IDOR integration tests on `/api/client/me` and intro feedback
- OWASP ZAP on staging (P16) — manual

---

## Acceptance criteria

- [x] Integration tests for auth, mutual, C2C, IDOR, billing dry-run
- [x] E2E covers verify → mutual → chat happy path
- [ ] No PR merge with failing `npm test`

## Open questions

- Contract tests against Razorpay sandbox?
