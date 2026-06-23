# KnotWise — The Matchmaker's Bureau

An operating console for a private matchmaking bureau. Editorial typography, sun-faded paper, a single signature interactive moment per screen.

## Stack

- Next.js 15 (App Router, React 19)
- TypeScript strict
- Tailwind CSS v4
- **PostgreSQL** + Prisma (multi-tenant org model)
- iron-session (matchmaker + client portal cookies)
- Resend (email), Stripe (billing), UploadThing (photos), Inngest (background jobs)
- NVIDIA NIM via OpenAI SDK (optional)
- Expo mobile app scaffold in `apps/mobile/`

## Quick start

```bash
npm install
cp .env.example .env

# Start PostgreSQL (Docker)
npm run docker:up

# Migrate & seed
npx prisma migrate deploy
npm run db:seed

npm run dev
# Matchmaker console: http://localhost:3000
# Client portal:     http://localhost:3000/portal/login
```

Set `EMAIL_DRY_RUN=true` in `.env` for local dev without Resend.

## Seed accounts

| Username | Password | Role |
|---|---|---|
| `riya` | `password123` | Matchmaker |
| `arjun` | `password123` | Matchmaker |
| `ops` | `password123` | Ops (all org customers, verification queue) |

Each matchmaker has 8 assigned customers. One of Riya's clients has a portal account (email from seeded biodata).

## Post-MVP features

| Feature | Route / API |
|---|---|
| Client portal | `/portal/*`, `/api/client/*` |
| Real email | Resend + `EMAIL_DRY_RUN` fallback |
| Billing | `/settings/billing`, Stripe webhooks |
| Collaboration | Handoffs, @mentions, `/ops` |
| Verification | `/ops` queue, `/api/verification/*` |
| Chat | Messages tab + `/portal/messages` |
| Photo upload | UploadThing on customer dossier |
| Bulk shortlist | Matches tab toolbar |
| ML re-rank | `/api/ml`, weekly Inngest cron |
| Mobile | `apps/mobile/` + `POST /api/auth/token` |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run docker:up` | Start Postgres via Docker Compose |
| `npm run db:seed` | Seed org, matchmakers, customers, pool |
| `npm run ml:tune -- <orgId>` | Offline weight tuning |
| `npm test` | Matching engine tests (15) |

## Environment variables

See [`.env.example`](.env.example) for `DATABASE_URL`, `SESSION_SECRET`, `RESEND_API_KEY`, `STRIPE_*`, `UPLOADTHING_*`, `INNGEST_*`, and NVIDIA NIM keys.
