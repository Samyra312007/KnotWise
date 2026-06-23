# 5. Implementation Plan

**Project:** KnotWise — TDC Matchmaker Dashboard
**Companion to:** all of [`1-PRD.md`](1-PRD.md), [`2-TRD.md`](2-TRD.md), [`3-Application-Flow.md`](3-Application-Flow.md), [`4-Backend-Schema.md`](4-Backend-Schema.md)
**Version:** 1.0
**Estimated build time:** ~2 focused build sessions (8–12 hours of agent work) for a feature-complete MVP.

---

## 5.1 Execution philosophy

Build in seven phases, in order. Each phase ends in a runnable, demonstrable state — so if we stop after Phase 4, we still have a working app (without AI). This keeps the demo path always-green and de-risks the integration order:

```
1 Foundation → 2 DB & Seed → 3 Auth → 4 Dashboard & Detail
              → 5 Match Engine → 6 AI Layer → 7 Send-Match & Polish
```

## 5.2 Phase 1 — Foundation (~30 min)

**Goal:** project boots, lint passes, empty page renders.

- [x] ~~`pnpm create next-app@latest knotwise ...`~~ — corepack/pnpm broken on env, scaffolded Next.js 15 manually (package.json, tsconfig, next.config.ts, eslint, postcss); using npm
- [x] Add deps: `prisma @prisma/client zod react-hook-form @hookform/resolvers iron-session bcryptjs openai @faker-js/faker date-fns clsx tailwind-merge lucide-react sonner`
- [x] Dev deps: `tsx vitest @types/bcryptjs tailwindcss@4 @tailwindcss/postcss`
- [x] ~~Install shadcn~~ — hand-rolled per design doc §6.4 instead (Button, Input, Label, Textarea, StagePill, Dropdown, Dialog, Tabs, Skeleton, CompatibilitySigil, Knot, EmptyState)
- [x] Add scripts to `package.json`: `db:migrate`, `db:seed`, `db:reset`, `test`, `typecheck`
- [x] Commit `.env.example`
- [x] Create folder skeleton (app/, components/, lib/, prisma/, tests/, data/)
- [ ] Add `README.md` with setup steps — final polish

**Done when:** `npm run dev` shows a styled "KnotWise" landing. ✅ verified on http://localhost:3001/login (200 OK).

## 5.3 Phase 2 — Database & seed (~1.5 h)

**Goal:** `pnpm db:reset && pnpm db:seed` gives a fully-populated SQLite DB.

- [x] Write `prisma/schema.prisma` (SQLite, JSON-as-String for biodata for portability)
- [x] `npx prisma migrate dev --name init`
- [x] Create `lib/db.ts` Prisma singleton
- [x] Create `lib/types.ts` (Gender, Trinary, Diet, Frequency, MaritalStatus, EducationLevel, Stage, PartnerPreferences, Biodata, ScoredCandidate, CustomerListItem)
- [x] Build `prisma/seed.ts`:
  - Curated Indian first-name / surname / mother-tongue / city lists in `prisma/seed-data.ts`
  - `generateBiodata(gender, opts)` helper using `faker` with `faker.seed(42)`
  - 3 matchmakers, 120 pool profiles, 24 customers (8 per matchmaker)
  - Idempotent (deleteMany before insert in FK-safe order)
  - Writes a copy to `data/dummy-profiles.json`
- [x] Verified via seed output: `{ matchmakers: 3, customers: 24, poolProfiles: 120 }`

**Done when:** seed succeeds and counts are correct. ✅

## 5.4 Phase 3 — Auth (~1 h)

**Goal:** Working login / logout, session protection, no UI yet beyond `/login`.

- [x] `lib/auth/session.ts` — iron-session config + `getSession()`, `requireSession()` helpers
- [x] `app/api/auth/login/route.ts` — bcrypt compare, set cookie, Zod-validated input
- [x] `app/api/auth/logout/route.ts` — destroy cookie
- [x] `app/(auth)/login/page.tsx` + `login-form.tsx` — RHF + Zod, designed to §6.5.1 (animated Knot hero, stagger reveal, "Enter the bureau")
- [x] `app/(app)/layout.tsx` — server-side `requireSession()`; renders `<HeaderRail />` per §6.3.3
- [x] Routes return 200; auth/redirect flow verified

**Done when:** Login works, session persists across refresh, unauthenticated visits to `/dashboard` redirect to `/login`. ✅

## 5.5 Phase 4 — Dashboard & Customer Detail (~2 h)

**Goal:** Real data visible end-to-end. AI and matches are stubbed.

- [x] `GET /api/customers` — scoped query, computes `age` and `lastActivityAt`
- [x] `GET /api/customers/:id` — ownership check, returns full biodata
- [x] `POST /api/customers/:id/notes` — Zod-validated insert (+ `GET` for feed)
- [x] `PATCH /api/customers/:id` — stage updates with ownership check
- [x] `app/(app)/dashboard/page.tsx` — server component with editorial greeting (per §6.5.2), passes data to `<Manifest />`
- [x] `components/manifest.tsx` — the printed-ledger customer table per §6.3.5 (search highlighting in marigold, stage pills, photo to right of name)
- [x] `app/(app)/customers/[id]/page.tsx` — Dossier layout per §6.3.4 (portrait inset, display-l name, marginalia notes, 3 tabs)
  - [x] `components/biodata-card.tsx` — Roman-numeral sectioned biodata; phone/email mask + 30s auto-remask
  - [x] `components/notes-feed.tsx` — two-column entries with live-clock composer
  - [x] Matches tab shows placeholder ("matching engine being fitted")
- [x] `components/stage-dropdown.tsx` → `PATCH /api/customers/:id` with optimistic update + toast

**Done when:** Riya can log in, see her 8 customers, search/filter, click into one, read full biodata, add a note, change stage. ✅

## 5.6 Phase 5 — Match engine (~2 h)

**Goal:** Suggested Matches tab fully working with deterministic scoring (still no LLM).

- [x] `lib/matching/types.ts` — `Dimension`, `SubScores`, `Weights`, `Strategy`, `StrategyResult`, `bucketFor`
- [x] `lib/matching/hard-filters.ts` — same-gender, religion-locked, diet-incompatible, marital-status-excluded
- [x] `lib/matching/scoring.ts` — 12 pure helpers (religion, motherTongue, caste, diet, wantKids, relocate, pets, education, education-female-pref, manglik, income-male, income-female, age-male, age-female, height-male, height-female)
- [x] `lib/matching/male-strategy.ts` & `female-strategy.ts` — weighted from TRD §2.5.2 (totals 100)
- [x] `lib/matching/index.ts` — `rankMatches(client, pool): RankedMatch[]`, sorted desc
- [x] `tests/matching.test.ts` — 15 tests, all passing:
  - per-dimension expected scores (religion, motherTongue, wantKids, diet, age)
  - male strategy: aligned young vegetarian Tamil candidate → `>= 75` ✅
  - female strategy: same religion + similar income + same city + higher edu → `>= 75` ✅
  - hard filter: same gender → never appears ✅
  - rankMatches sorts descending ✅
  - bucket boundaries (75/74/54)
- [x] `GET /api/customers/:id/matches?bucket=high|medium|all&limit=12` — ownership check, opposite-gender pool, `rankMatches`, top N, `alreadySent` map via `MatchSuggestion`, AI explanations (batched 5-at-a-time) with deterministic fallback
- [x] `components/match-card.tsx` — `<CompatibilitySigil />` (96px two-arc), italic explanation, "Why this score?" breakdown table (dim, weight, sub-score, contribution); 12-card stagger reveal

**Done when:** Matches tab shows 10–12 ranked candidates per customer, scores feel sane, all vitest tests pass. ✅ Verified via API: customer "Ishaan" returns 12 high-potential candidates, top score 90.

## 5.7 Phase 6 — AI layer (~2 h)

**Goal:** Real NVIDIA NIM-powered explanations and email drafts, with rock-solid fallback.

- [x] `lib/ai/client.ts` — `complete(messages, opts): Promise<string | null>` with lazy OpenAI init, 6 s `AbortController` timeout, 1 retry, dev-only token logging
- [x] `lib/ai/prompts.ts` — `EXPLAIN_SYSTEM_PROMPT` (one sentence, top-2 dimensions), `EXPLAIN_FEWSHOT`, `EMAIL_SYSTEM_PROMPT` (100-160 words, strict JSON output), `summarizeForPrompt()`
- [x] `lib/ai/explain.ts` — `explainMatch()` + `explainMatchesBatch()` with 5-at-a-time batching
- [x] `lib/ai/email.ts` — `draftIntroEmail()` with safe-JSON parsing, returns `{ subject, body, source }`
- [x] `lib/ai/fallback.ts` — `explainMatchFallback()` (top-2 dimensions sentence) + `draftIntroEmailFallback()` (templated email)
- [x] Matches route parallelises `explainMatchesBatch` and falls back per-item to template on failure
- [x] `POST /api/ai/intro-email` route → calls `draftIntroEmail`, returns `{subject, body, source}`
- [x] Tested without `NVIDIA_NIM_API_KEY`: app renders explanations and email drafts from fallback; UI shows "Written from template" indicator
- [x] Modal labels source explicitly: "Drafted by the AI" vs "Written from template"

**Done when:** Match cards show real one-sentence explanations; Send-Match modal opens with a real draft email body; everything still works with the API key removed. ✅

## 5.8 Phase 7 — Send Match & polish (~1.5 h)

**Goal:** Closes the loop. Demo-ready.

- [x] `components/send-match-modal.tsx` — pre-filled from `/api/ai/intro-email` with skeleton-shimmer while drafting; subject & body fields; "Cancel" + accent "Send to {firstName}"; full-screen **vermilion Knot** success animation on send
- [x] `POST /api/matches/send` — ownership check, upserts `MatchSuggestion` (status `sent`), inserts `EmailLog`, bumps `Active → Match Sent`
- [x] On success: close modal, sonner toast ("Sent to {firstName}."), card updates to "Already sent — TODAY", stage pill animates if bumped
- [x] "Matches sent" section under Notes tab — `GET /api/customers/:id/sent` returns `EmailLog` joined with candidate names; clicking a row opens the sent email in a read-only `<Dialog />`
- [x] Empty / loading / error states for every list per design doc §6.5.7 and §6.6
- [x] Accessibility floor: keyboard tab order, `:focus-visible` rings in `marigold`, `aria-live="polite"` errors, `prefers-reduced-motion` respected globally in `globals.css`, semantic landmarks
- [x] `README.md` with env vars, seed users, demo script, scripts table

**Done when:** the full MVP acceptance checklist from [PRD §1.10](1-PRD.md#110-mvp-acceptance-criteria) passes in a fresh browser. ✅

## 5.9 Definition of Done (project-level)

- [x] `npm run typecheck` clean ✅
- [ ] `npm run lint` — not yet exercised (next step before any deploy)
- [x] `npm test` green — 15/15 ✅
- [x] `npx prisma migrate dev && npm run db:seed && npm run dev` results in a usable app ✅
- [x] Demo script in README walks a new dev through login → send match in under 5 minutes ✅
- [x] Matching engine fully pure-function (`lib/matching/*` no I/O) ✅

## 5.10 Stretch (post-MVP, not in scope)

These are intentionally listed so the MVP code stays small but extensible:

- Bulk "shortlist top N" action that pre-creates `MatchSuggestion` rows
- Inline feedback on a sent match (accepted / declined) feeding back into the algorithm
- Re-rank using a learned model trained on `MatchSuggestion.status` history
- Two-matchmaker collaboration on a single customer
- Real email via Resend / SES
- Profile photo upload (S3 / UploadThing)
- Multi-tenant org support (each TDC team = an org)
- Switch SQLite → Vercel Postgres for production

## 5.11 Risk register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| NVIDIA NIM rate limits during demo | Medium | Medium | Batch of 5, 6s timeout, deterministic fallback always present |
| LLM produces culturally tone-deaf email | Low | High | System prompt + few-shot examples explicitly anchored to neutral, respectful tone; matchmaker reviews every email before "sending" |
| Algorithm bias (e.g. always favours same caste) | Medium | High | Caste weight is intentionally lower than mother tongue + values; unit tests for cross-caste cases; matchmaker always sees breakdown |
| SQLite single-writer contention in production | Low (MVP) | Low | Documented Postgres migration path; only one matchmaker per session; small DB |
| Scope creep into client-facing features | Medium | Medium | Non-goals explicitly listed in PRD §1.3 |
