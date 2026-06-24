# 10. Compliance and Legal

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Phase:** P15

---

## 10.1 India DPDP Act (2023)

| Requirement | Implementation |
|-------------|----------------|
| Consent | Checkbox at signup; granular marketing opt-in |
| Purpose limitation | Privacy policy lists matchmaking, verification, billing |
| Data principal rights | Export + delete APIs |
| Data fiduciary | Bureau org as controller; KnotWise as processor |
| Cross-border | Kundli API data — explicit consent + DPA with vendor |

---

## 10.2 Terms of Service (outline)

- Eligibility: 18+, matrimonial intent
- Bureau-mediated intros; no guarantee of marriage
- Prohibited: fake profiles, harassment, commercial solicitation
- Account termination for violations
- Dispute resolution: India jurisdiction

---

## 10.3 Privacy Policy (outline)

- Data collected: biodata, photos, messages, payment metadata
- Sharing: matchmakers, matched clients (gated), service providers
- Retention: active account + 2 years; messages 1 year post-close
- Cookies: session only; analytics opt-in

---

## 10.4 Matrimonial advertising norms

- No caste superiority language in marketing
- Verified claims only in client-facing badges
- Parent/guardian flows disclosed in privacy policy

---

## 10.5 Consent flows

| Moment | Consent |
|--------|---------|
| Signup | ToS + Privacy + processing biodata |
| Kundli P12 | Birth time/place to third party |
| Contact share P3 | Explicit toggle post-mutual |
| Marketing email | Separate opt-in |

---

## 10.6 Data export / deletion

### `GET /api/client/data-export`

JSON bundle: profile, messages, intros within 72h.

### `POST /api/client/delete-account`

- 30-day grace period
- Anonymize messages; delete photos from CDN
- Notify assigned matchmaker

---

## Scope

Legal pages, DPDP, export/delete, consent, matrimonial norms.

## Non-goals

Legal review replacement — counsel sign-off required pre-launch.

## Acceptance criteria

- [x] Privacy policy linked at signup
- [x] Export completes <72h
- [x] Deletion removes PII from primary DB

## Open questions

- Data residency requirement for Postgres region?
