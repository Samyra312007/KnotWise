# ADR 007: Family Delegate Permission Model

**Status:** Accepted  
**Date:** 2026-06-23

---

## Context

P10 family/guardian accounts are common in Indian matrimonial. Permission scope affects privacy and mutual intro flow.

## Decision

Two delegate **roles**:

| Role | Can view | Can act |
|------|----------|---------|
| **Observer** | Limited reveals, journey stage, completeness | No accept/decline |
| **Approver** | Same as observer | Accept/decline intros on behalf of client (audit logged) |

Rules:

- Client must invite delegate; delegate verifies via OTP (P5)
- Approver actions require client age < 35 OR explicit client opt-in for any age
- Delegate never sees other party contact until **mutual + client enables share**
- Max 3 delegates per client

## Consequences

**Positive:** Culturally aligned; audit trail for disputes  
**Negative:** Edge cases when client and delegate disagree — client decision wins if client also acts

## References

- PRD §P10
- [`7-Glossary-and-Personas.md`](../7-Glossary-and-Personas.md) §7.3
