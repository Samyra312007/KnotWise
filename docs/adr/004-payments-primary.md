# ADR 004: Payments Primary Stack

**Status:** Accepted  
**Date:** 2026-06-23

---

## Context

Bureau SaaS billing (Stripe) exists in post-MVP code. India consumer premium needs UPI/cards local rails.

## Decision

- **Bureau SaaS:** **Stripe** (Checkout, Customer Portal, webhooks) — keep existing integration
- **Client premium (P11):** **Razorpay** (Subscriptions + UPI + webhooks)
- Single `ClientBilling` / `Subscription` abstraction with `provider` field

GST invoices via Razorpay for India clients; Stripe Tax for bureau international later.

## Consequences

**Positive:** Best-in-class for each segment  
**Negative:** Two webhook endpoints, two reconciliation flows

## References

- [`16-Payments-Billing.md`](../16-Payments-Billing.md)
- PRD §P11
