# 6. Frontend Design Prompts

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Supersedes:** [`archive/v1/6-Frontend-Design-Prompts.md`](archive/v1/6-Frontend-Design-Prompts.md)

### Changelog v2.0

- Part A: Bureau console (unchanged thesis; see archive for full v1 prompts)
- Part B: Client portal & mobile (new)

---

## Part A — Matchmaker bureau (shipped)

**Thesis:** Editorial almanac for a private bureau — sun-faded paper, Fraunces + Geist, one vermilion moment per screen.

**Full v1 prompts:** [`archive/v1/6-Frontend-Design-Prompts.md`](archive/v1/6-Frontend-Design-Prompts.md) §6.1–6.7 (tokens, Knot, CompatibilitySigil, HeaderRail, Dossier, Manifest, Send Match modal).

**Key tokens (unchanged):** `paper` `#E9DFC6`, `ink` `#1F1A2C`, `vermilion` `#D43E2C`, `moss` `#516A3F` (success).

**Screens (shipped):** `/login`, `/dashboard`, `/customers/[id]`, Send Match modal, `/ops`.

---

## Part B — Client portal & mobile

### 6.8 Client portal thesis

**One-line:** The client portal feels like a **personal letter from the bureau** — warm, unhurried, and private — not an ops console.

| Bureau console | Client portal |
|----------------|---------------|
| Dense manifest tables | Card-based intros |
| Vermilion once per screen | Moss for accepted mutual |
| Matchmaker-first copy | "You" and first names |
| Full biodata density | Progressive reveal |

**Typography:** Same token stack; display sizes one step smaller (`display-m` max for headings). More `body-l` prose for bios.

**Max width:** 720px (`max-w-3xl`) — intimate reading column.

---

### 6.9 Onboarding wizard (P1)

- Progress: `Step 3 of 7 — 64% complete` in Geist Mono meta
- Completeness bar: thin `marigold` fill on `paper-deep` track
- One primary CTA per step: `Continue` / `Finish profile`
- No skip on required steps; Back allowed
- Photo step: upload dropzone (P2) or URL input (P1 interim)

**Empty:** First visit welcome — "Let's set up your profile."

---

### 6.10 Intro card & mutual unlock (P3)

**Intro card (limited reveal):**

```
┌─────────────────────────────────────┐
│  [photo 96px]   Priya, 29           │
│                 Bangalore           │
│  ─────────────────────────────────  │
│  High Potential · 82                │
│  "Both vegetarian, aligned on..."   │
│                                     │
│  [ Decline ]    [ Accept intro ]    │
└─────────────────────────────────────┘
```

- Accept: quiet button → moss confirmation animation (Knot tie, smaller 120px)
- Post-mutual: card expands to full biodata sections; moss badge "Mutual match"

**Declined:** card moves to "Past intros" list, muted `ink-mute`.

---

### 6.11 C2C chat (P4)

- Bubble layout: client messages `paper-deep` right; other party left
- Input: single line + send; no reactions v1
- Read receipt: Geist Mono `Seen` in `ink-mute`
- Block: overflow menu → report/block (P5)

Mobile: full-screen chat; keyboard-safe input bar.

---

### 6.12 Family delegate view (P10)

- Banner: "Viewing as delegate for Aanya"
- Actions: Approve / Decline only if Approver role
- No access to matchmaker private notes

---

### 6.13 Discovery feed (P9)

- Vertical card stack (not Tinder full-bleed swipe v1 — list with "Interested" CTA)
- Filter sheet: city, age range, religion
- Hybrid copy: "Your matchmaker will be notified of your interest."

---

### 6.14 Mobile patterns (P8)

| Tab | Icon | Screen |
|-----|------|--------|
| Home | house | Journey stage + next action |
| Intros | envelope | Match list |
| Chat | message | C2C threads |
| Profile | person | Edit + settings |

Push opens relevant tab via deep link.

---

### 6.15 Consumer empty/error states

| Screen | Empty | Error |
|--------|-------|-------|
| Intros | "No introductions yet. Complete your profile to help your matchmaker." | "Could not load. Pull to refresh." |
| Chat | "When you have a mutual match, conversation opens here." | "Message not sent. Retry." |
| Discover | "No profiles match your filters." | "Discovery unavailable." |

Copy voice: warm, never gamified ("crush", "swipe", "fire" banned per v1 §6.6).

---

### 6.16 Verification badges & multi-photo (P2/P5)

| Badge | Visual |
|-------|--------|
| Email verified | Small indigo dot on avatar |
| Phone verified | Mono label `Verified phone` |
| ID verified | Indigo pill `ID verified` |
| Photo verified | Marigold ring on avatar |

Photo gallery: horizontal scroll, 3:4 aspect, 2px radius; primary photo first.

---

## 6.17 Accessibility (both surfaces)

- WCAG AA contrast on `paper` / `ink`
- Focus rings: 2px `indigo` offset
- All icons paired with text labels in portal (mobile tab bar)

---

## Acceptance criteria

- [ ] Part B sections referenced when building portal P3+ UI
- [ ] Bureau Part A unchanged in production console

## Open questions

- Dark mode for client portal only?
- Localized Hindi labels for delegate flow?
