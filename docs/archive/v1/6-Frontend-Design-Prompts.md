# 6. Frontend Design Prompts

Project: KnotWise.
Companion to: 1-PRD.md, 2-TRD.md, 3-Application-Flow.md.
Version: 1.0.
Status: Source of truth for every frontend decision in the build.

This document is the single brief the agent feeds itself before touching any UI code. Each section below is a self-contained prompt. When building a screen, open the matching section here and follow it literally. Do not invent new tokens, colors, or motion outside what is defined here. Where a screen needs something new, add it here first.

Inspirations are drawn from Awwwards Site of the Day winners in the editorial, archival, and luxury-services categories - the visual register of an independent magazine published by a private bureau, not a SaaS dashboard.

---

## 6.1 Design thesis

**One-line:** KnotWise is the operating console for a private matchmaking bureau, designed as if it were an annual almanac edited by hand - editorial typography, sun-faded paper, hairline rules, one signature interactive moment per screen.

**Subject we are designing for.** A 28-year-old matchmaker named Riya, sitting in a small Mumbai office at 9pm, opening one of 50 client files for the third time this week. She knows these people. She does not need cheerful onboarding tooltips or KPI cards. She needs a beautiful, calm, decisive workbench that respects her expertise and treats every profile as a person, not a row.

**One screen, one job.** Every screen does one thing well. Login authenticates. Dashboard triages. Detail dwells. Matches ranks. Send Match closes the loop. Notes remember. We never crowd a screen with secondary jobs.

**The risk we are taking (and defending).** The default for a SaaS dashboard is a left sidebar, a top bar with KPI cards, and a data table flanked by line charts. We reject this entirely. KnotWise has no sidebar. The dashboard is a centered editorial canvas with a slim top rail, the customer table reads like a printed manifest with hairline rules, and the customer detail page is laid out like a feature article with marginalia for notes. We spend our boldness on typography and one signature element per screen; everything else is disciplined and quiet. If the matchmaker mistakes the app for a hand-bound ledger in the first three seconds, we have won.

**What we explicitly reject.** The three AI-default looks (cream + serif + terracotta; near-black + acid green; broadsheet hairlines with no warmth), Inter as a body face, Cormorant or Playfair as the display face, generic shadcn "dashboard" layouts copied verbatim, gradient hero text, glowing cards, decorative iconography that does not encode information, emojis as visual seasoning, and any motion that does not serve a job.

---

## 6.2 Brand tokens

These are the only tokens used in the build. Add - never substitute.

### 6.2.1 Color

A daylight palette tuned for long sessions. Background is a confident sun-faded muslin (not cream, not white, not gray), text is a deep aubergine-black (not pure black), and a single warm vermilion is the signature accent.

| Token | Hex | Usage |
|---|---|---|
| `paper` | `#E9DFC6` | Main canvas background. Saturated enough to read as paper, not as a desaturated cream. |
| `paper-deep` | `#D9CDB0` | Secondary surface: cards, modal background, hover state of rows. |
| `paper-quiet` | `#F1E9D3` | Tertiary surface: inset blocks, code-like boxes, the body of pills. |
| `ink` | `#1F1A2C` | Primary text, hairlines at 100%, icons. Deep aubergine-black. |
| `ink-warm` | `#3E3344` | Secondary text, dimmer labels. |
| `ink-mute` | `#6B5F76` | Tertiary text, captions, meta labels at rest. |
| `vermilion` | `#D43E2C` | The signature accent. Used once per screen, never twice. Primary CTA color, the "active" state on tabs, the lead arc on the compatibility sigil, the wordmark dot. |
| `marigold` | `#C29736` | Secondary accent. The "High Potential" bucket, the score arc partner, the eyebrow rule on hover. |
| `indigo` | `#21306E` | Tertiary accent. Stage pills, inline links, the second arc on the compatibility sigil. |
| `moss` | `#516A3F` | Positive state: "Active" stage, success toast, "match accepted" state (post-MVP). |
| `dust` | `#A89A82` | Hairline rules at 60%, disabled states, watermark text. |
| `error` | `#9B2A1B` | Error text and destructive states. Deeper than vermilion so it cannot be confused with the signature. |

**Rules.**
1. Every screen uses `paper` as canvas, `ink` as text, and at most **one** of `vermilion`, `marigold`, or `indigo` as the signature highlight. If a screen needs two highlights, one of them is wrong.
2. Hairlines are always `ink` at 12% (`#1F1A2C1F`), never gray.
3. `paper-deep` is only allowed on surfaces that contain content - cards, modals, the matchmaker rail. It never bleeds across the full page.
4. The score arc always uses `marigold` + `indigo` as its two strands, never `vermilion`. Vermilion is reserved for one moment per screen and the score is too prominent to spend it on.

### 6.2.2 Typography

We use exactly three families. No fourth.

| Role | Family | Weights | Notes |
|---|---|---|---|
| Display | **Fraunces** (variable) | 300, 400, 500, 700 | Axes used: `opsz` (set to 144 at display sizes, 72 at subheads, 24 below), `SOFT` (set to 80 - high, organic warmth), `WONK` (off). Always paired with negative tracking. |
| Body | **Geist** (variable) | 400, 500, 600 | Single tracking value (-0.01em) and a 1.55 line height for body text. |
| Data / utility | **Geist Mono** | 400, 500 | All numbers (ages, scores, percentages, dates), all eyebrows, every meta label. Tabular by default. |

These two families - Fraunces with `SOFT=80` and Geist - are an intentional pairing. The organic, almost-handwritten warmth of Fraunces against the geometric precision of Geist is the typographic signature of the system. The agent does not substitute Inter for Geist or Playfair for Fraunces. If a network problem prevents loading either, the page falls back to `Georgia, serif` and `system-ui, sans-serif` respectively - never to a different web font.

**Type scale.**

| Step | Size / Line / Tracking | Family | Used for |
|---|---|---|---|
| `display-xl` | 96 / 0.92 / -0.04em | Fraunces 400, opsz 144, SOFT 80 | Login hero, dashboard greeting. Once per screen. |
| `display-l` | 64 / 0.95 / -0.03em | Fraunces 400, opsz 144 | Customer detail full name. |
| `display-m` | 40 / 1.00 / -0.025em | Fraunces 500, opsz 72 | Modal titles, section openers. |
| `subhead` | 22 / 1.20 / -0.01em | Fraunces 500, opsz 24 | Card titles, tab labels at large size. |
| `body-l` | 17 / 1.55 / -0.005em | Geist 400 | Bio paragraphs, email bodies, long-form prose. |
| `body` | 14 / 1.55 / -0.005em | Geist 400 | Default body text, form labels, table cells. |
| `body-s` | 13 / 1.50 / 0em | Geist 400 | Helper text, secondary metadata in dense areas. |
| `meta` | 11 / 1.00 / 0.18em | Geist Mono 500, uppercase | Eyebrows above sections, table column headers, "AS OF" labels. |
| `numeric-l` | 28 / 1.00 / -0.01em | Geist Mono 500, tabular | The score number on the compatibility sigil. |
| `numeric` | 14 / 1.00 / 0em | Geist Mono 400, tabular | Ages, dates, weights, INR figures. |

**Numbers always use Geist Mono with `font-variant-numeric: tabular-nums`.** Never use a proportional sans for numerics in a table.

### 6.2.3 Spacing & layout

Spacing scale (multiples of 4, with editorial generosity at the top end):

`4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192`

Grid: **12 columns, 64px gutter, 1320px maximum content width**, centered. Most content sits in columns 2-11 (10 cols). Signature elements (the login knot, the customer-detail name, the success state) push to full bleed; everything else respects the 10-column inset.

Mobile: collapse to a single column with a 24px gutter. The dashboard table becomes a stack of cards, the customer detail tabs become a vertical accordion. We will not optimize visual design for screens below 360px wide.

### 6.2.4 Radius & strokes

| Surface | Radius | Reasoning |
|---|---|---|
| Cards, modals, panels | 0px | Paper has no curve. |
| Inputs, buttons, dropdowns | 2px | Just enough to read as a control. |
| Pills (stage tags only) | 999px | Semantic: pills imply something in motion through stages. |
| Photos | 0px on the dashboard manifest, 2px in cards | Photos are documents in the bureau. |
| The compatibility sigil | arcs, no fills | See 6.3.2. |

All strokes are 1px and use `ink` at 12% opacity. Hover states intensify to 24%. There is no shadow system. Elevation is communicated by paper color shifts (paper -> paper-deep), not by `box-shadow`. The single exception is the modal scrim (a `paper`-tinted overlay at 70% opacity over a 2px ink-tinted shadow at the modal edge).

### 6.2.5 Motion

Easing tokens:

| Token | Curve | Used for |
|---|---|---|
| `out-expo` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrances, reveals, the default. |
| `in-out-quint` | `cubic-bezier(0.83, 0, 0.17, 1)` | Page transitions, the knot tie. |
| `linear` | `linear` | Counters, score number tickers. |

Duration tokens:

| Token | ms | Used for |
|---|---|---|
| `micro` | 120 | Hover state changes, focus rings. |
| `quick` | 220 | Toast in/out, dropdown reveal. |
| `standard` | 360 | Tab swaps, modal in/out, page-load stagger steps. |
| `signature` | 720 | The knot tying itself on login, the success state, the page-load hero reveal. |

Universal rules:
1. Every animation honors `prefers-reduced-motion: reduce` by collapsing to a 1ms opacity fade. The signature animations become a static end state.
2. No `scale` > 1.02 on hover. We are not a marketing page.
3. No bouncy springs. The aesthetic is calm and considered.
4. The page-load hero reveal on login and dashboard staggers three elements (eyebrow, display, supporting line) at 0ms, 120ms, 240ms with `standard` duration and `out-expo`. After this, the page is silent unless the user acts.

---

## 6.3 Signature elements

These five elements are the visual identity of KnotWise. They must be built exactly as specified and used consistently across screens. If a screen does not need a signature element, it does not get one - we do not scatter them.

### 6.3.1 The Knot (`<Knot />`)

A single continuous SVG path that resembles a saath-phere knot - a figure-eight crossing with an interior loop, drawn as if by a single stroke of a fine-nib pen.

**Path data (canonical).** Viewbox `0 0 120 120`. Single stroke, no fill. The path threads through itself at two intersection points; the crossings are rendered by mask cutouts so the stroke visibly passes under itself at one of the two intersections.

**Specifications.**
- Stroke: `currentColor`. Default `ink` at 90% opacity. On the dashboard rail it inherits `ink-warm`; in the login hero it is `ink` at 100%; on the send-match success state it is `vermilion` at 100%.
- Stroke width: 1.4px at small sizes (16-32px), 1.6px at medium (32-96px), 2px at large (96-240px), 2.4px at the hero size (240-480px).
- `stroke-linecap: round`, `stroke-linejoin: round`.
- The path total length is approximately 760 units; cache this in code as `KNOT_LENGTH = 760`.
- The knot has handedness: it always crosses left-over-right at the upper intersection and right-over-left at the lower. Do not mirror it.

**Animated variant: `<Knot animate />`.**
- On mount, `stroke-dasharray = KNOT_LENGTH; stroke-dashoffset = KNOT_LENGTH`.
- Animate `stroke-dashoffset` from `KNOT_LENGTH` to `0` over `signature` duration with `in-out-quint`. The knot draws itself in one continuous gesture.
- The second-crossing mask reveals at 70% through the animation, so the knot appears to tie itself rather than be drawn flat.
- With `prefers-reduced-motion: reduce`, render the final state immediately.

**Where it appears.**
- **Login screen:** 280px wide, centered above the wordmark, animated once on first mount.
- **Header rail wordmark:** 18px, static, sits to the left of "KnotWise".
- **Stage pill "Match Sent":** 12px inline before the label, static.
- **Send-match success state:** 360px, centered on a full-screen `paper` overlay for 720ms, then fades back to the matches tab. This is the single most memorable moment in the product and it earns its weight by happening only when a real match has actually been sent.

The Knot is never decorative. It always means: "this is a real match motion" - whether that is the first introduction (login), the bureau's brand mark (rail), the state of a customer (pill), or the completion of an action (success).

### 6.3.2 The Compatibility Sigil (`<CompatibilitySigil score={n} />`)

Replaces every progress bar and ring chart in the application. Renders the 0-100 compatibility score as two arcs of differing color that intertwine and meet at the score number.

**Geometry.**
- A 96px square viewbox containing two arc paths on a shared center.
- Both arcs start at -150 degrees (lower-left) and end at -30 degrees (lower-right), sweeping over the top.
- Arc `A` is `indigo` (client strand). Arc `B` is `marigold` (candidate strand).
- The two arcs are offset by 6px radially, with `A` outside and `B` inside.
- Their sweep angle is `60 + (score / 100) * 240` degrees. At score 0 they are short 60deg crescents; at score 100 they are nearly full hoops.
- Where they meet at the apex, the two strands appear to weave: arc `A` masks under arc `B` for the last 12% of the sweep.

**Center label.** The numeric score in `numeric-l` (`Geist Mono` 28/-0.01em, tabular). Below it, in `meta` (Geist Mono 11/0.18em uppercase): "OF 100".

**Bucket indicator.** Below the sigil, a hairline rule and a single-word bucket: "HIGH POTENTIAL" (marigold), "WORTH CONSIDERING" (indigo at 70%), or "LOW FIT" (ink-mute). Always `meta` styling.

**Motion.** On reveal, the arcs draw from start to end over `standard` duration with `out-expo`, and the numeric score counts up from 0 to its final value over the same duration with `linear` easing. Numbers are tabular so the counter does not jitter.

**Sizes.**
- `lg` (96px): match cards.
- `md` (64px): customer detail header (overall match readiness).
- `sm` (32px): inline references in notes (no number, just two short arcs and a small marigold dot if score is high).

### 6.3.3 The Bureau Rail (`<HeaderRail />`)

A 56px-tall hairline-thin top strip. The rail is not a navbar. It does not contain menu items. It is the title plate of the bureau.

**Structure (three slots, all typography, no icons).**

- **Left slot:** the static knot mark (18px) plus the wordmark "KnotWise" in Fraunces 500 18/-0.01em with a 0.06em vermilion dot at the start of the letter K. The dot is one of the rare uses of vermilion on this surface.
- **Center slot:** the current location as a typographic breadcrumb sentence, in `body` Geist 400. Example: "Riya - My customers - Aanya Mehra". Separator is an en dash with thin spaces, not a chevron. The current page word is `ink` at 100%; preceding words are `ink-mute`. Each preceding word is a link.
- **Right slot:** matchmaker name in `body` Geist 500, followed by a `meta` styled "LOG OUT" link to the right. No avatar circle, no initials bubble. The name is the identity.

**Hairline.** A 1px `ink` 12% rule sits at the bottom of the rail.

**Behavior.** Sticky to top with a subtle backdrop change after 24px of scroll: the `paper` becomes `paper` at 92% opacity with a 4px backdrop-blur, so the page content beneath softens but the rail does not become an opaque bar.

### 6.3.4 The Dossier layout (Customer Detail page)

The detail page is laid out as a feature article. This is the most distinctive layout move in the entire system.

**Composition (desktop).**

```
| col 1  |        cols 2-7 (display & body)       | cols 8-11 (marginalia) |
| ---    |  Roman I.                              |  ----                   |
| photo  |  Aanya Mehra                           |  Stage pill             |
| 4col   |  (display-l, Fraunces, full bleed name)|  (current journey       |
| photo  |  hairline rule                         |   stage, editable)      |
|        |  meta line: 28 - Bangalore - Designer  |                         |
|        |                                        |  Marginalia notes feed  |
|        |  I. Identity                           |  (the user's notes from |
|        |  body content in two sub-columns       |   the Notes tab appear  |
|        |                                        |   here as printed       |
|        |  II. Origins                           |   marginalia, italic,   |
|        |  body content                          |   in body-s, with a     |
|        |                                        |   thin vermilion        |
|        |  ...etc through VII...                 |   marginal rule)        |
```

- The portrait photo is **not** centered. It occupies columns 1-2 at 240x320 (a portrait crop, no border-radius), aligned to the top of the page. A single hairline frames it on the right side only - imitating a photo tipped into a printed page.
- The customer's name in `display-l` spans columns 3-9. It is set in Fraunces with `SOFT=80` so the curves are warm.
- Section eyebrows use **Roman numerals**, not Arabic. "I. IDENTITY", "II. ORIGINS", "III. PROFESSION", "IV. FAMILY", "V. LIFESTYLE", "VI. PARTNER PREFERENCES", "VII. BIO". These encode the dossier-as-document feel and they refer back to a real, ordered structure rather than decorating arbitrarily.
- The right marginalia column (cols 8-11) shows the **stage pill** at the top, then the **last 5 notes** in italic body-s with a thin vermilion left rule, each timestamped in `meta`. Clicking "View all notes" jumps to the Notes tab. This is the single place in the system where vermilion appears on a non-CTA surface, justified because the notes are the matchmaker's personal annotations on the dossier.

**On mobile,** the marginalia collapses to a single section below the bio, and the photo becomes a 160px square at the top-left of the meta block.

### 6.3.5 The Manifest table (Dashboard customer list)

Replaces the standard "shadcn data table" entirely. Designed to look like a hand-typed manifest of names in a ledger.

**Structure.**
- No background fill. Rows sit on `paper`.
- Each row is **64px tall** with a 1px `ink/12` bottom rule. The topmost row also has a top rule. The table breathes.
- Column headers are `meta` styling (Geist Mono 11/0.18em uppercase): `NAME`, `AGE`, `CITY`, `STATUS`, `STAGE`, `LAST SEEN`. Header row has its own 1.5x weight bottom rule (`ink/24`).
- The Photo is **not a column**. Instead, each name cell shows the first name in Fraunces 400/22 immediately followed by the last name in Geist 500/16, on the same baseline, with 12px between them - reading like a typeset full name on a name plate. The photo appears as a 32px square thumbnail to the **right** of the name (not before it), separated by 24px - a small "tipped-in" identifier rather than the row's anchor. This single reversal of where the photo sits is one of the small details that makes the dashboard recognizable.
- Stage column uses pill tokens (see 6.4.2).
- Last seen is in `numeric` Geist Mono tabular, formatted as "12 Apr" or "today" or "3d ago".
- Hover state: the row's `paper` becomes `paper-deep`. No other change. No left border, no scale.
- Active filter terms in the search input cause matching characters in names to gain a `marigold` highlight box at 30% opacity. Search becomes a typographic event, not a results spinner.

---

## 6.4 Component prompts

These are the leaf-level UI primitives. They are built once, used everywhere.

### 6.4.1 `<Button />`

Three variants only. No "tertiary", no "link", no "subtle" - if a moment is not worth one of these three, it is text.

| Variant | Background | Text | Border | Used for |
|---|---|---|---|---|
| `primary` | `ink` | `paper` | none | The single primary action on a screen. |
| `accent` | `vermilion` | `paper` | none | The action that *commits* (Send, Save). One per screen at most. |
| `quiet` | transparent | `ink` | 1px `ink/24` | Cancel, secondary actions, filters. |

- Height: 44px (default), 36px (compact in dense surfaces like filter bars).
- Padding: 24px horizontal on default, 16px on compact.
- Radius: 2px.
- Typography: Geist 500/14, tracking -0.005em, single-line.
- Hover: brightness shifts 6% darker on filled, border opacity rises to 36% on quiet. `micro` duration.
- Focus: 2px outline in `marigold` at 64% opacity, with a 2px offset. Visible on keyboard focus only.
- Disabled: 40% opacity, no pointer cursor, no hover.
- Loading: text is replaced with an inline 14px ascii-like glyph rotation ("/", "-", "\\", "|") changed every 120ms. This is intentionally low-fi. No spinning rings.

### 6.4.2 `<StagePill stage={...} />`

Pill height 28px, padding 12px horizontal, radius 999px, typography `meta` (Geist Mono 11/0.18em uppercase).

| Stage | Background | Text | Adornment |
|---|---|---|---|
| `Onboarding` | `paper-quiet` | `ink-warm` | none |
| `Active` | `moss` 18% | `moss` darkened | none |
| `Match Sent` | `paper-quiet` | `ink` | Static knot mark (12px) before label |
| `In Conversation` | `indigo` 16% | `indigo` | none |
| `Paused` | `dust` 24% | `ink-warm` | none |
| `Closed - Engaged` | `marigold` 24% | `ink` | small filled marigold dot before label |
| `Closed - Dropped` | transparent | `ink-mute` | hairline border `ink/24` only |

Pills are read-only when displayed in tables. On the customer detail header (right marginalia), the pill is interactive: clicking it opens a dropdown of stages, each item styled identically.

### 6.4.3 `<Input />`, `<Textarea />`, `<Select />`

- Background: `paper-quiet`.
- Border: 1px `ink/24` at rest. `ink/48` on focus. No focus ring shadow.
- Radius: 2px.
- Height: 44px on input/select. Textarea minimum 96px, resizes vertically.
- Inner padding: 14px horizontal, 12px vertical.
- Label: sits **above** the field, in `meta` styling. Never floating, never inside the field.
- Placeholder: `ink-mute` italic.
- Error state: bottom border becomes 2px `error`, label color becomes `error`, helper text below in `error` body-s.
- The search input on the dashboard has an inline 16px lucide `Search` icon at the left of the label (not the field), in `ink-mute` - a small typographic gesture rather than an iconified field.

### 6.4.4 `<Tabs />`

- Tabs sit on a hairline rule across the page width.
- Each tab label is `subhead` style (Fraunces 500/22).
- Active tab has a 2px `vermilion` underline that runs the width of the label text plus 8px on each side. The underline animates between tabs over `standard` duration with `out-expo`.
- Inactive tabs are `ink-mute`; hover lifts to `ink-warm`.
- Tabs are full-width; on this product there are always exactly three (Biodata, Suggested Matches, Notes & History).

### 6.4.5 `<Dialog />` (Modal)

- Scrim: `paper` at 70% opacity over a 4px `ink/8` backdrop-blur. The page softens but does not vanish.
- Modal surface: `paper-deep`, 0px radius, 1px `ink/16` border, 64px padding on desktop / 24px on mobile.
- Maximum width: 720px for content modals, 560px for confirmations.
- The close affordance is a `quiet` button in the bottom-left of the modal footer, labeled "Cancel" or "Close" - never an X glyph in the corner. We name what the action does.
- Title: `display-m` (Fraunces 500/40).
- Body: `body-l` (Geist 400/17).
- Enter motion: opacity 0->1 and translateY 12px->0 over `standard` with `out-expo`. Scrim fades 0->0.7 over `quick`.

### 6.4.6 `<Toast />` (via Sonner)

- Position: bottom-center, 32px from the bottom edge.
- Width: auto, max 480px.
- Surface: `ink`, text in `paper`.
- A 2px `vermilion` accent rule on the left edge for success toasts; `marigold` for info; `error` for errors.
- Typography: `body` Geist 400/14.
- Auto-dismiss: 5000ms for success/info, 7000ms for errors.
- One toast at a time; new toast replaces (not stacks) the previous.

### 6.4.7 `<Skeleton />`

- Surface: `paper-deep`.
- A subtle `paper`-tinted shimmer that traverses left-to-right every 1600ms with `linear` easing.
- We do not use the shadcn pulse animation; the shimmer is a single moving 96px-wide gradient band, more like the way paper catches light when tilted.
- Skeletons match the actual shape they replace (a name skeleton is the same width and height as the name it stands in for). They never look like generic gray boxes.

### 6.4.8 `<EmptyState />`

Used wherever a list could be empty. Structure (vertically stacked, centered):

1. `meta` eyebrow: a single all-caps line saying what is missing (`NO NOTES YET`, `NO MATCHES IN HIGH POTENTIAL`).
2. `subhead` Fraunces 500/22: a single sentence in the bureau's voice, written for this exact empty state. Never "No data".
3. `body` Geist 400/14: a one-sentence next action.
4. `quiet` button: the next action.

Empty states are written as if a thoughtful colleague is briefly stepping in. Examples below in 6.6.

---

## 6.5 Per-screen prompts

Each section below is a self-contained brief. When the agent builds a screen, it reads only the matching section here and the tokens in 6.2-6.4. Nothing more.

### 6.5.1 `/login` - The Threshold

**Job.** Authenticate the matchmaker. Make the first three seconds with the product unmistakable.

**Composition.** A single centered column, max 480px wide, on a full-page `paper` canvas. Vertical rhythm from top:

1. 96px from the top of the viewport: the animated knot at 280px square, centered.
2. 32px gap.
3. Wordmark "KnotWise" in Fraunces 500/24 with the vermilion dot on the K. Centered.
4. 8px gap.
5. `meta` line: "THE MATCHMAKER'S BUREAU - EST. 2026". Centered, `ink-mute`.
6. 64px gap.
7. The form: two stacked inputs (Username, Password), then the primary button, then any error.

**Hero motion.** On first mount, the knot animates over `signature` duration. Simultaneously, the wordmark and meta line stagger-reveal at 240ms and 360ms. The form fades in at 600ms. After 720ms, the page is still.

**Form.**
- Username and Password inputs use the `<Input />` primitive, with labels styled as `meta` above each field.
- Submit button is `primary` (ink/paper), 100% width of the column, labeled "Enter the bureau" - not "Sign in", not "Log in".
- Error appears below the button in `body-s` `error` color: "Those credentials did not match. Try again." - not "Invalid credentials".

**No.** No "Forgot password?" link (out of scope, MVP), no "Remember me" checkbox, no social login, no signup CTA.

**Pre-fill on dev only.** If `process.env.NODE_ENV === "development"`, the username field placeholder reads `try: riya`. Not pre-filled - just hinted.

**Background detail.** A single hairline rule at 24% opacity stretches across the page at the visual horizon (50% viewport height) on screens taller than 720px. This is the only chrome on the page. It mimics the binding line of a ledger book.

### 6.5.2 `/dashboard` - The Manifest

**Job.** Let Riya scan all her customers in one screen and reach any of them in three keystrokes or less.

**Composition.**

1. `<HeaderRail />` at top.
2. 96px top spacing.
3. Eyebrow `meta`: today's date as "TUESDAY, 23 JUNE 2026 - 8 CUSTOMERS UNDER REVIEW".
4. 12px gap.
5. Greeting in `display-xl` (Fraunces 96/0.92/-0.04em): "Good evening, Riya." The greeting word ("evening", "morning", "afternoon", "late") changes by local hour. After 22:00, the greeting becomes "Still here, Riya." - a small recognition that matchmakers work late.
6. 8px gap.
7. `body-l` ink-warm: a single sentence telling her something true about today, written from a small template:
   - If a customer crossed into a new stage today: "Aanya Mehra moved to Match Sent this afternoon."
   - Else if any new notes today: "You added 3 notes today."
   - Else: "Eight files, none touched since yesterday." (or accurate variant)
8. 48px gap.
9. The Filter rail: a single horizontal row containing the search input (320px wide), a divider hairline, three stage filter pills (selectable), a city dropdown, and a "Show all" reset link at the far right. Labels above each control in `meta` style.
10. 32px gap.
11. The `<Manifest />` table (see 6.3.5). 
12. 96px bottom spacing.

**Filter behavior.** Filtering is client-side. The table updates instantly with no spinner. The result count below the table reads `meta` style: "SHOWING 5 OF 8" when filtered, "8 CUSTOMERS" when not.

**Row click.** Clicking a row pushes to `/customers/[id]`. There is a 120ms exit transition where the row's content slides up 8px and fades, while the next page fades in beneath. The transition feels like turning a page rather than navigating an app.

**Empty state.** When the matchmaker has no customers: centered `<EmptyState />` with copy from 6.6.

**Error state.** If the customer list fails to load: centered card with `subhead` "We could not reach your customer list." and a `quiet` button labeled "Try again."

### 6.5.3 `/customers/[id]` - The Dossier

**Job.** Let Riya remember and understand one person well enough to act.

**Composition.** Use the **Dossier layout** from 6.3.4. Three tabs sit immediately below the meta line and above the body content area.

**Top of page (above tabs).**
- Photo block (cols 1-2): 240x320 portrait, 0px radius, with a single hairline rule on its right edge - no full border.
- Name (cols 3-9): `display-l` Fraunces 64. Full name on one line; if too long for the column, wraps before the surname.
- Meta line below name in `body` Geist 400/14: `28 years - Bangalore, India - Software Engineer at Stripe`. Separators are en dashes with thin spaces.
- A single hairline rule across cols 2-11.
- The right marginalia column (cols 8-11) carries: the editable stage pill at the top, then the "marginalia notes" feed (last 5 notes, styled per 6.3.4), then a small `meta` "VIEW ALL NOTES" link at the bottom.

**Tabs (centered on a hairline rule across cols 2-11).**
- "Biodata" - "Suggested Matches" - "Notes & History"
- Active tab uses the `<Tabs />` primitive from 6.4.4 with `vermilion` underline.

**Tab A: Biodata.** Renders sections I through VII as defined in 6.3.4. Each section opens with a Roman numeral eyebrow + section name. Inside each section, fields are laid out as a two-column **definition list**:

```
   Mother tongue          Tamil
   Religion               Hindu
   Caste                  Iyer
   ...
```

- Term column is `meta` ink-mute, right-aligned, 200px wide.
- Definition column is `body` ink, left-aligned.
- Vertical rhythm between rows: 12px.
- Sub-section dividers are 1px ink/12 hairlines at 32px vertical spacing.
- Phone and email in the Contact section are **masked** by default (`+91 - ****** - 4382`); a quiet "Reveal" link to the right reveals the field for 30 seconds and then re-masks automatically.

**Tab B: Suggested Matches.** Documented in 6.5.4.

**Tab C: Notes & History.** Documented in 6.5.5.

**Stage dropdown.** Clicking the stage pill in the marginalia opens a dropdown anchored to the pill. Each option is styled as the pill itself - the user is choosing the new pill identity, not picking from a generic menu.

### 6.5.4 Suggested Matches tab

**Job.** Present a ranked, defensible shortlist of candidates with the reasoning visible, and let the matchmaker send any of them in two clicks.

**Composition.**

1. A horizontal segmented control at the top with three options: `HIGH POTENTIAL` (default selected), `WORTH CONSIDERING`, `ALL`. Styled like three small `meta` text labels separated by hairline dividers, with a 2px `vermilion` underline marking the active one (consistent with `<Tabs />`).
2. To the right of the segment control: a small live counter in `meta`: `12 CANDIDATES IN HIGH POTENTIAL` (or similar).
3. 32px gap.
4. The match cards, vertically stacked with 24px between them.

**`<MatchCard />` structure.** Each card occupies the full content width (cols 2-11) and is **not a boxed card** - it is a row separated from siblings by hairline rules above and below, with 32px vertical padding. This dissolves the conventional "card" and lets the matches read as printed entries.

Left column (cols 2-4): photo (96x128 portrait, 0px radius, hairline-framed right edge).

Center column (cols 5-9):
- Name in `subhead` (Fraunces 500/22) followed inline by `body` meta: ` - 28 - Bangalore - Software Engineer at Stripe`.
- 8px gap.
- The AI explanation sentence in `body-l` Geist 400/17, italic. Maximum two lines (clamped). Italic because it is a written remark, not data.
- 12px gap.
- A `meta` link "Why this score?" that toggles a per-dimension breakdown table below the card. The table uses `body-s` and `numeric` styles; each row is `dimension name`, `weight`, `sub-score`, `contribution`.

Right column (cols 10-11):
- The `<CompatibilitySigil />` at `lg` (96px).
- Below the sigil, two stacked buttons:
  - "View profile" (`quiet`)
  - "Send match" (`accent`, vermilion) - this is the one vermilion moment per screen.
- If the candidate has already been sent: replace the Send button with a `meta` line "ALREADY SENT - 12 APR" and a `quiet` "Re-open email" button.

**Order, motion, and empty.**
- Cards mount in a staggered reveal: each card 80ms after the previous, opacity 0->1 and translateY 8px->0 over `standard`, `out-expo`. Cap stagger at 12 cards.
- Each `<CompatibilitySigil />` animates its arcs and counter once on mount.
- Empty state when bucket is empty: see 6.6 ("No matches in High Potential...").
- Loading: 4 skeleton cards using `<Skeleton />` shimmer, sized exactly like the real card.

### 6.5.5 Notes & History tab

**Job.** Capture and recall every conversational moment with a customer, and show the audit trail of matches already sent.

**Composition.**

Two stacked sections.

**Section 1: Add a note.**
- `meta` eyebrow "NEW ENTRY".
- A `<Textarea />` 96px tall, placeholder "Write what was said, decided, or noticed.".
- Below the textarea, right-aligned: a 16px hairline divider and a `primary` button labeled "Add note".
- Above the textarea on the right, in `meta`: the current timestamp updating live, and the matchmaker's name. The textarea acts as if it is being typewritten into a dated entry on a sheet of paper.

**Section 2: The feed.**
- `meta` eyebrow "ENTRIES (newest first)".
- Each note rendered as:
  - A hairline rule (top of entry).
  - 24px padding above and below.
  - Two-column row: a 200px left column with `meta` timestamp (`24 JUN, 18:42`) and matchmaker name; a body column with the note text in `body-l`.
- Below the notes feed, a sub-section "MATCHES SENT" lists every email log row in the same two-column rhythm, with the candidate name in `subhead`, sent-date in `meta`, subject line in `body`. Clicking the row opens the sent email in a read-only modal.

**Empty.** No notes: the entire feed section is replaced by an `<EmptyState />` with copy from 6.6.

### 6.5.6 Send Match modal

**Job.** Let Riya review an AI-drafted introduction email, edit if needed, and send it confidently.

**Composition.**

- Use the `<Dialog />` primitive (6.4.5).
- Title in `display-m`: "Introduce Priya Iyer to Aanya Mehra." - never "Send Match", which is an internal verb. The modal speaks the action in human English.
- Below the title, in `body-s` ink-mute: "This is a draft. You can edit anything before sending."
- 32px gap.
- "Subject" field, `meta` label, `<Input />`.
- 16px gap.
- "Body" field, `meta` label, `<Textarea />` 360px tall.
- 24px gap.
- A small `meta` indicator showing the draft source: `DRAFTED BY THE AI` (when `source === "llm"`) or `WRITTEN FROM TEMPLATE` (when `source === "fallback"`). The latter is presented as a feature, not a fallback message, because the matchmaker is in control either way.
- Footer (sticky inside the modal): left side a `quiet` "Cancel" button; right side an `accent` (vermilion) button labeled "Send to Aanya".

**Loading state for the draft.** While the email is being drafted, the Body textarea shows a `<Skeleton />` shimmer at full size. The Subject field shows skeleton text too. The "Send to Aanya" button is disabled during draft load. Maximum visible loading time before fallback is 6 seconds (per TRD).

**Success path.** On click of "Send to Aanya":
1. Modal closes with `quick` exit motion.
2. The page transitions briefly to **the Knot success state** - the full-screen `paper` overlay with the 360px Knot drawn in `vermilion` at the center. Duration: `signature` (720ms).
3. Sonner toast appears with success copy from 6.6.
4. The match card updates: Send button becomes "ALREADY SENT - TODAY".
5. If customer stage was `Active`, it bumps to `Match Sent` and the marginalia pill animates from `Active` styling to `Match Sent` styling over `standard` (the moss fades out, the knot mark fades in).

### 6.5.7 Loading and error full-page states

- Initial customer load (Dashboard): the Manifest renders 6 skeleton rows; the greeting renders immediately if the matchmaker name is known (because it sits in the session).
- Customer detail load: the Dossier layout renders with the photo as a skeleton, the name as a Skeleton sized for `display-l`, and Roman-numeral section eyebrows in real text. This makes the structure of the page visible while data loads.
- 404 (customer not owned or missing): page renders the HeaderRail, then a centered block - `display-m` "This file is not in your bureau." with a `body` line "It may belong to another matchmaker, or it may have been closed." and a `quiet` button "Back to my customers."
- 500 (any unexpected error): same composition with `display-m` "Something went wrong on our side." `body` "We have logged it. Try again, or come back in a minute." `quiet` "Reload."

---

## 6.6 Copy voice

The bureau speaks in a register that is **plain, specific, and quietly warm**. It never sells. It never apologizes. It addresses the matchmaker as a colleague and refers to customers and candidates by their first names.

**Rules.**
1. Verbs are concrete: "Introduce", "Add note", "Reveal phone", "Re-open email". Not "Submit", "OK", "Done".
2. Sentence case everywhere. No Title Case In Buttons.
3. Empty states never use the word "data". They name the missing thing.
4. Errors say what happened and what to do. They do not apologize and they do not use the word "Oops".
5. No emoji, anywhere, ever.
6. The product is "the bureau", not "the platform" or "the tool". Internal voice only - not in marketing copy.

**Library.**

- **Login button**: "Enter the bureau"
- **Login error**: "Those credentials did not match. Try again."
- **Logout link**: "LOG OUT"
- **Dashboard greeting variants**: "Good morning, Riya." / "Good afternoon, Riya." / "Good evening, Riya." / "Still here, Riya."
- **Dashboard empty state**:
  - Eyebrow: `NO CUSTOMERS ASSIGNED`
  - Subhead: "Your bureau is quiet."
  - Body: "Once ops assigns customers to you, they will appear here."
  - Button: "Refresh"
- **Dashboard error**:
  - Subhead: "We could not reach your customer list."
  - Button: "Try again"
- **Customer detail - revealed phone tooltip**: "Re-masks in 30 seconds."
- **Suggested Matches default copy** (above cards): none. The cards speak for themselves.
- **Suggested Matches empty state for High Potential bucket**:
  - Eyebrow: `NO HIGH POTENTIAL MATCHES TODAY`
  - Subhead: "Nobody in the pool crosses 75 for Aanya right now."
  - Body: "Try Worth Considering or All for a wider view."
  - Button: "Show Worth Considering"
- **Notes empty state**:
  - Eyebrow: `NO ENTRIES YET`
  - Subhead: "Nothing has been written down."
  - Body: "Add the first entry after your next call."
  - (no button - the composer above is the action)
- **Send Match modal title**: "Introduce {candidate.firstName} to {customer.firstName}."
- **Send Match modal subtitle**: "This is a draft. You can edit anything before sending."
- **Send Match success toast**: "Sent to {customer.firstName}." (No exclamation mark. The bureau is calm.)
- **Match card "Already sent" label**: "ALREADY SENT - {date}"
- **Stage dropdown header**: `CHANGE STAGE`
- **404 page**: "This file is not in your bureau."
- **500 page**: "Something went wrong on our side."

---

## 6.7 Accessibility floor

Built in from the first commit. Non-negotiable.

1. **Keyboard.** Every interactive element reachable in a sensible tab order. Tabs use arrow-left/right. Dropdowns use up/down + enter. Modals trap focus and restore it on close. The dashboard table rows are buttons (so they have focus rings and Enter activates them).
2. **Focus rings.** Always visible on keyboard focus. 2px `marigold` 64% outline with 2px offset. Hidden on mouse focus (`:focus-visible`).
3. **Contrast.** Body text on `paper` is 12.6:1 (AAA). All UI text meets AA at minimum. The score number on the sigil is checked against both `paper` and `paper-deep`.
4. **Reduced motion.** Every animation has a reduce-motion fallback. The Knot snap-renders to its final state. Stagger reveals collapse to a 1ms fade. The compatibility sigil arcs render fully without sweep.
5. **Color is never the only signal.** The `Match Sent` stage pill carries the static Knot mark, not just a color shift. Sigil bucket labels carry text ("HIGH POTENTIAL"), not just hue.
6. **Reading order.** Each page has exactly one `<h1>` (the dashboard greeting / the customer name / the login wordmark). Section eyebrows are `<h2>` semantically with their visual `meta` styling. Roman numerals are decorative `aria-hidden` spans.
7. **Forms.** Every field has a `<label>` linked by `htmlFor`. Errors are announced via `aria-live="polite"`. Required fields are marked in both color and a "Required" suffix in the label.

---

## 6.8 Responsive behavior

The product is built first for desktop (1320px content max). Below that:

- 1024-1280: layout intact, content max 960px, gutter shrinks to 48px.
- 768-1024 (tablet): the Dossier marginalia column drops below the body content as its own section; the dashboard manifest becomes a flat card list with the photo on the right of the name still preserved.
- 360-768 (phone): single column. The dashboard greeting drops to `display-l` (64px). Tabs become a horizontally scrollable strip. The match card stacks vertically: photo (140x180), name + meta, explanation, sigil + buttons. The Send Match modal becomes full-screen.
- Below 360: graceful degradation only - we do not optimize visuals here.

---

## 6.9 What "done" looks like

A screen is finished when:

1. It matches the prompt section above pixel-for-spirit (token values exact, layout structure exact).
2. It uses only the tokens in 6.2.
3. It uses only the components in 6.4.
4. It uses at most one signature element from 6.3 unless the screen explicitly calls for more.
5. Its copy comes from 6.6 or extends 6.6 in the same voice.
6. Keyboard, focus, and reduced-motion are all honored.
7. The empty, loading, and error states are all present and use the right copy.
8. Nothing on screen looks AI-generated, templated, or "in the style of shadcn dashboard kit".

This document is the only frontend brief. The agent does not improvise tokens, motion curves, or copy outside of it. New screens extend this document first, build second.