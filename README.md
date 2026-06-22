# KnotWise — The Matchmaker's Bureau

An operating console for a private matchmaking bureau. Editorial typography, sun-faded paper, a single signature interactive moment per screen. Built to the design system in [`docs/6-Frontend-Design-Prompts.md`](docs/6-Frontend-Design-Prompts.md).

## Stack

- Next.js 15 (App Router, React 19)
- TypeScript strict
- Tailwind CSS v4 (CSS-first `@theme` tokens)
- Prisma + SQLite (file: `prisma/dev.db`)
- iron-session (HTTP-only cookie auth)
- React Hook Form + Zod
- NVIDIA NIM via OpenAI SDK (optional; deterministic template fallback if absent)
- Vitest for the matching engine

## Quick start

```bash
# 1. Install
npm install

# 2. Set up env (already provided in .env)
cp .env.example .env

# 3. Migrate & seed (3 matchmakers, 24 customers, 120 pool profiles)
npx prisma migrate dev --name init --skip-seed
npm run db:seed

# 4. Run
npm run dev
# open http://localhost:3000
```

> The implementation plan calls for pnpm, but pnpm is broken on the current dev machine (corepack signature key issue). All commands use npm directly; scripts in `package.json` work the same.

## Seed accounts

| Username | Password | Role |
|---|---|---|
| `riya` | `password123` | Matchmaker (Riya Kapoor) |
| `arjun` | `password123` | Matchmaker (Arjun Mehta) |
| `ops` | `password123` | Ops desk |

Each matchmaker is assigned 8 customers (mix of genders and journey stages).

## Demo script (under 5 minutes)

1. Open `http://localhost:3000` — redirects to `/login`. Watch the **Knot** draw itself on first load.
2. Log in as `riya` / `password123` → land on `/dashboard` with the editorial greeting.
3. Search "Aanya" or filter by stage — the matching characters get a marigold highlight.
4. Click any row — the page transitions into the **Dossier layout** (Roman-numeral biodata sections, marginalia notes in the right column).
5. Open the **Suggested matches** tab — 12 ranked candidates appear with **Compatibility Sigils** (two-arc score rings) and AI/template explanations.
6. Click "Why this score?" on any card to inspect the dimension breakdown.
7. Click "Send match" → the modal pre-fills a draft via NVIDIA NIM (or the template fallback). Edit and send.
8. Watch the full-screen **vermilion Knot** mark the moment, see the toast, and watch the card flip to "Already sent".
9. Open **Notes & history** to see the matches-sent log and add a meeting note.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript strict check |
| `npm run lint` | Next/ESLint |
| `npm test` | Vitest run (matching engine) |
| `npm run db:seed` | Seed reproducible profiles (`faker.seed(42)`) |
| `npm run db:reset` | Drop & re-migrate the SQLite DB |
| `npm run db:studio` | Open Prisma Studio |

## Architecture

See:

- [`docs/1-PRD.md`](docs/1-PRD.md) — product requirements, user stories, scope
- [`docs/2-TRD.md`](docs/2-TRD.md) — technical requirements, algorithms, non-functional bar
- [`docs/3-Application-Flow.md`](docs/3-Application-Flow.md) — page flows, sequence diagrams, state machines
- [`docs/4-Backend-Schema.md`](docs/4-Backend-Schema.md) — Prisma schema, types, API contracts
- [`docs/5-Implementation-Plan.md`](docs/5-Implementation-Plan.md) — seven-phase build plan with checkmarks
- [`docs/6-Frontend-Design-Prompts.md`](docs/6-Frontend-Design-Prompts.md) — the design brief used to build every screen

## AI configuration

The app runs **without** an API key — explanations and emails fall back to deterministic templates. To enable real LLM:

```env
NVIDIA_NIM_API_KEY=your_key_here
NVIDIA_NIM_MODEL=z-ai/glm-5.1
NVIDIA_NIM_BASE_URL=https://integrate.api.nvidia.com/v1
```

Timings (validated against `z-ai/glm-5.1` on the NVIDIA NIM endpoint):

- Match explanations: ~1.5 s per candidate (6 s timeout, 1 retry, batched 5-at-a-time)
- Email draft: ~6 s per call (20 s timeout, no retry — falls back to template if it exceeds)

Both calls fail gracefully to the deterministic templates in `lib/ai/fallback.ts`. The Send Match modal labels the source explicitly ("Drafted by the AI" vs "Written from template") so the matchmaker always knows.

## Production migration

To deploy to Vercel + Postgres:

1. In `prisma/schema.prisma`, change `provider = "sqlite"` → `"postgresql"`.
2. Set `DATABASE_URL` to your Postgres URL.
3. `npx prisma migrate deploy`.
4. Run `npm run db:seed` (or skip in production).

The `biodata` columns are stored as JSON strings (portable across SQLite and Postgres without code changes).
