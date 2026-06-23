# ADR 003: OTP Provider

**Status:** Accepted (phased)  
**Date:** 2026-06-23

---

## Context

P5 requires production phone/email verification. India SMS delivery needs DLT-compliant providers.

## Decision

**Phase 1:** Email magic link (shipped) + email OTP for sensitive actions.  
**Phase 2 (P5):** **MSG91** for India SMS OTP (DLT templates, UPI market fit).  
**Fallback:** Twilio for international numbers if bureau expands.

Store OTP hashes in `VerificationAttempt`; 6-digit, 10-minute TTL, rate limit 5/hour/phone.

## Consequences

**Positive:** MSG91 pricing and India compliance  
**Negative:** Two providers if international later

## References

- [`9-Trust-and-Safety.md`](../9-Trust-and-Safety.md) §9.2
- PRD §P5
