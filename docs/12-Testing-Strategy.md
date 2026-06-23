# 12. Testing Strategy

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved

---

## 12.1 Test pyramid

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Matching engine, completeness, pure lib |
| Integration | Vitest + test DB | API routes with Prisma |
| E2E | Playwright | Critical journeys |
| Mobile | Detox (P8) | Login, intros, chat |
| Load | k6 (P16) | Chat, discover |

---

## 12.2 Current coverage (shipped)

- `tests/matching.test.ts` — 15 rule engine tests
- `tests/profile-completeness.test.ts` — P1 scoring

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
- Seed script for E2E: two clients + one intro

---

## 12.5 CI gates

- PR: typecheck + unit + integration
- Main: + E2E smoke on staging
- Release: load test report attached

---

## 12.6 Security tests

- OWASP ZAP on staging (P16)
- IDOR tests on all `/api/client/*` routes

---

## Scope

Unit through load; GWT for P1–P8 critical paths.

## Acceptance criteria

- [ ] E2E covers signup → mutual → chat happy path
- [ ] No PR merge with failing `npm test`

## Open questions

- Contract tests against Razorpay sandbox?
