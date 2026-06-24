# 11. Infrastructure and Deployment

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Phase:** P16

---

## 11.1 Environments

| Env | Purpose | Database |
|-----|---------|----------|
| local | Dev | Docker Postgres |
| preview | PR branches | Neon branch |
| staging | QA | Neon staging |
| production | Live | Neon prod + replicas |

---

## 11.2 Services

| Service | Provider (recommended) |
|---------|------------------------|
| App | Vercel |
| Postgres | Neon or Supabase |
| Redis | Upstash (P6) |
| CDN | CloudFront / Vercel Blob |
| Email | Resend |
| Jobs | Inngest |
| Errors | Sentry |

---

## 11.3 CI/CD

```yaml
on: [push, pull_request]
jobs:
  - npm run typecheck
  - npm test
  - prisma migrate diff (staging)
  - vercel deploy (preview)
```

Production deploy: merge to `main` → Vercel prod + `prisma migrate deploy`.

---

## 11.4 Secrets

All secrets in Vercel env; never in repo. Rotate quarterly: `SESSION_SECRET`, API keys.

---

## 11.5 Backups

- Postgres: daily automated (Neon PITR)
- RPO: 24h; RTO: 4h
- Test restore quarterly

---

## 11.6 Monitoring

| Signal | Tool |
|--------|------|
| Uptime | Vercel + Better Stack |
| Errors | Sentry |
| DB slow queries | Neon dashboard |
| Audit | `AuditEvent` export |

---

## 11.7 Rate limiting

- Vercel edge middleware or Upstash rate limit
- Per-IP public endpoints; per-user authenticated

---

## 11.8 Incident runbook

1. Ack in #incidents
2. Assess Sentry + logs
3. Rollback Vercel deployment if needed
4. Postmortem within 48h

---

## Scope

Hosting, CI/CD, backups, monitoring, rate limits.

## Acceptance criteria

- [x] Staging mirrors prod schema
- [x] Backup restore tested (Neon PITR documented)
- [x] p95 API monitored via `/api/ops/scale`

## Open questions

- Multi-region failover needed for launch?
