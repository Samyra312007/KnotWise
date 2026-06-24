# 16. Payments and Billing

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Shipped (P11)  
**Phase:** P11

---

## 16.1 Two revenue lines

| Line | Provider | Customer |
|------|----------|----------|
| Bureau SaaS | Stripe (shipped) | Organization |
| Client premium | Razorpay (shipped) | End client |

Per [ADR 004](adr/004-payments-primary.md).

---

## 16.2 Bureau SaaS (shipped)

- Stripe Checkout + Customer Portal
- `Subscription` model on org
- Feature gates: seats, customers, emails/month, AI calls
- Routes: `/settings/billing`, `/api/billing/*`, `/api/webhooks/stripe`

---

## 16.3 Client premium tiers (shipped)

| Tier | Price (INR/mo) | Features |
|------|----------------|----------|
| Included | 0 | Bureau enrollment |
| Plus | 499 | Priority verification, 2 extra intro requests/mo |
| Premium | 999 | Discovery access P9, profile boost |

Entitlement stored on `ClientBilling.plan`. Gates enforced in `lib/billing/client-entitlements.ts`.

---

## 16.4 Razorpay integration (shipped)

- Checkout: `POST /api/client/billing/checkout`
- Webhook: `/api/webhooks/razorpay` (idempotent via `BillingWebhookEvent`)
- Dry run: `RAZORPAY_DRY_RUN=true` (default) simulates UPI success locally
- GST invoice records on `ClientBillingInvoice` (18% GST)
- Dunning: `payment.failed` → past_due → downgrade after 3 days

---

## 16.5 Self-serve bureau signup (shipped)

- `/signup/bureau` — org name, slug, owner credentials
- 14-day trialing `Subscription` in database
- Optional Stripe Checkout with trial when `STRIPE_*` configured

---

## 16.6 Refunds & dunning

- Client cancel: `POST /api/client/billing/cancel` → Included
- Failed payment webhook triggers grace period then downgrade

---

## Scope

Stripe bureau + Razorpay client + self-serve bureau + GST.

## Non-goals

In-app crypto payments.

## Acceptance criteria

- [x] UPI payment completes in sandbox (dry-run + Razorpay live when configured)
- [x] Webhook updates entitlements within 60s
- [x] Feature gates enforce plan limits

## Open questions

- Success fee billing model legal review?
