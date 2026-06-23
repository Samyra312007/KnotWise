# 1. Product Requirements Document (PRD)

**Project:** TDC Matchmaker Dashboard & Matching Algorithm — MVP
**Codename:** KnotWise
**Owner:** Internal Product / Matchmaking Operations
**Version:** 1.0
**Status:** Approved for MVP build

---

## 1.1 Background

The Date Concierge (TDC) is scaling its concierge matchmaking operation. Today, matchmakers manage their client pipelines in spreadsheets, WhatsApp threads, and ad-hoc notes. As the client base grows past a few dozen per matchmaker, this becomes lossy, error-prone, and impossible to QA.

The Indian matrimonial market is dominated by self-serve platforms (Shaadi.com, Jeevansathi, BharatMatrimony) where the user does their own searching. TDC differentiates by offering **human-curated matches** — a matchmaker reviews verified profiles, considers cultural and personal compatibility, and proposes matches with context. To scale this human touch, the matchmaker needs **operational tooling**, not a consumer app.

This MVP is that operational tool.

## 1.2 Problem statement

A TDC matchmaker working with 30–80 active clients today cannot reliably:

- See the current journey stage of every client at a glance
- Open a single profile and have all biodata, preferences, notes, and previously-suggested matches in one place
- Generate a ranked shortlist of candidate matches from the verified pool, with the reasoning made explicit
- Send a curated match introduction to the client without copy-pasting between tools

This causes (a) slower turnaround per client, (b) inconsistent match quality across matchmakers, and (c) zero data trail for QA, retention analysis, or model training.

## 1.3 Goals & non-goals

### Goals (MVP)

- G1. A matchmaker can log in and see only their assigned clients.
- G2. A matchmaker can view a complete biodata for any assigned client.
- G3. The system surfaces a ranked shortlist of candidate matches from a pool of 100+ profiles, with a transparent score and a one-sentence AI explanation.
- G4. The matching logic is gender-aware and reflects real Indian matchmaking conventions (not just generic similarity).
- G5. The matchmaker can record meeting/call notes against a client.
- G6. The matchmaker can "Send Match" — triggering a mock email and logging the action.

### Non-goals (explicitly out of MVP)

- N1. Client-facing app or login.
- N2. Real email delivery (mock/toast only).
- N3. Payments, subscriptions, or billing.
- N4. Multi-matchmaker collaboration features (handoff, comments, @mentions).
- N5. Profile verification workflow (profiles are assumed pre-verified).
- N6. Chat/messaging between client and match.
- N7. Mobile-native apps (responsive web is sufficient).
- N8. Real Kundli / horoscope computation. (Manglik field is captured but not algorithmically scored in MVP.)

## 1.4 Target users

**Primary persona — Riya, the matchmaker**

- 28, based in Mumbai, manages ~50 active clients
- Power user of Google Sheets, comfortable with Notion / Hubspot
- Workflow today: opens client's biodata PDF, mentally filters the verified-profile sheet, emails matches manually
- Wants: speed, fewer tabs, a "second opinion" she can override

**Secondary persona — Arjun, the ops lead**

- Onboards new matchmakers, audits match quality, reports to leadership
- Wants: consistency across matchmakers, an audit log of who sent which match to whom and why

## 1.5 User stories

| ID | As a matchmaker, I want to... | So that... |
|----|-------------------------------|-----------|
| US-01 | log in with a username and password | only I see my clients |
| US-02 | see all my assigned clients on one dashboard | I can triage by stage |
| US-03 | filter / search clients by name, city, or status | I can find a client in under 5 seconds |
| US-04 | click a client and see their full biodata | I have full context before suggesting matches |
| US-05 | see a ranked shortlist of suggested matches for a client | I can start with the strongest candidates |
| US-06 | see *why* each match was suggested (score + AI explanation) | I trust and can defend the recommendation |
| US-07 | open a candidate's full profile from the shortlist | I can do a deeper read before sending |
| US-08 | record a note (free text) against a client | I remember what was discussed last call |
| US-09 | click "Send Match" and have a draft intro email appear | I can review and "send" without copy-paste |
| US-10 | see which matches I've already sent for a client | I don't accidentally re-send the same profile |

## 1.6 Feature scope

### 1.6.1 Authentication
- Username + password login (seeded matchmaker accounts, no signup).
- Session via HTTP-only cookie. Logout button in header.
- Only that matchmaker's customers are visible.

### 1.6.2 Dashboard — Customer list
- Table of customers assigned to logged-in matchmaker.
- Columns: Photo, Name, Age, City, Marital Status, **Journey Stage** (status tag), Last Activity.
- Search by name; filter by stage and city.
- Click row → Customer Detail.

**Journey Stages (status tags):**
1. `Onboarding` — biodata being collected
2. `Active` — actively being matched
3. `Match Sent` — at least one match introduced, awaiting feedback
4. `In Conversation` — client is talking to a match
5. `Paused` — temporarily off the pipeline
6. `Closed — Engaged` / `Closed — Dropped`

### 1.6.3 Customer Detail view
Three tabs:

- **Biodata** — full profile (see field list §1.7)
- **Suggested Matches** — ranked list from the dummy pool with score + AI explanation; each row has "View Profile" and "Send Match"
- **Notes & History** — chronological feed of notes + a log of matches already sent

### 1.6.4 Matching pool
- Static seed of **120 verified dummy profiles** (60 male, 60 female), realistic Indian demographic distribution.
- For each customer, the pool considered = opposite gender profiles only.

### 1.6.5 Matching algorithm
Hybrid, gender-aware. See [`docs/2-TRD.md`](2-TRD.md#52-matching-algorithm) for the formula; product behaviour:

- **For male clients:** algorithm prefers women who are 1–5 years younger, of equal or lower income bracket, of equal or shorter height, and aligned on "want kids" — but the matchmaker can override.
- **For female clients:** algorithm prefers men of compatible (similar-or-higher) education and income, aligned values (religion, diet, want kids), and compatible relocation/city preferences. Age window is wider (-2 to +6 years) and height/income hard-thresholds are softer.
- **Universal hard filters (both genders):** opposite gender; religion compatible (same OR client marked open); diet compatible; not the same person.
- **Score is 0–100** and bucketed: `High Potential` (≥75), `Worth Considering` (55–74), `Low Fit` (<55, hidden by default).

### 1.6.6 AI usage (mandatory)
NVIDIA NIM (OpenAI-compatible) powers two features:

1. **Match explanation** — given client biodata + candidate biodata + raw rule scores, the LLM returns a 1–2 sentence human explanation ("Both vegetarian Tamil Brahmins in Bangalore tech, aligned on wanting 2 kids; she's 3 years younger and similar income bracket.").
2. **Intro email draft** — given client + candidate, generates a warm, ~120-word email the matchmaker sends to the client introducing the candidate.

Both features have a **deterministic local fallback** so the app never breaks when the API key is absent or the call fails.

### 1.6.7 Send Match
- Modal with the pre-filled draft email (subject + body).
- Matchmaker can edit before "sending".
- Clicking "Send" closes the modal, shows a success toast, logs the event, and bumps the customer's stage to `Match Sent` if currently `Active`.
- The candidate is recorded against the customer; the shortlist UI shows a "Already sent" badge on future loads.

### 1.6.8 Notes
- Free-text note with auto-timestamp and matchmaker attribution.
- Newest-first feed, no edit/delete in MVP (immutable audit trail).

## 1.7 Biodata field specification

The brief lists 20 fields. Research into Shaadi.com / Jeevansathi / standard biodata formats shows the following additional fields are standard in Indian matchmaking and should be added:

### Required (from brief)
First Name, Last Name, Gender, Date of Birth, Country, City, Height (cm), Email, Phone, Undergraduate College, Degree, Annual Income (INR), Current Company, Designation, Marital Status, Languages Known, Siblings, Caste, Religion, Want Kids, Open to Relocate, Open to Pets.

### Added based on Indian-matchmaking research
- **Mother Tongue** (e.g. Tamil, Hindi, Marathi) — primary cultural signal, often weightier than caste in modern matches
- **Sub-caste / Community** (optional free text)
- **Gotra** (optional, hidden by default; used for hard-filter "same gotra" rejection where applicable)
- **Manglik Status** — `Yes` / `No` / `Don't know` / `Doesn't matter`
- **Diet** — `Vegetarian` / `Eggetarian` / `Non-vegetarian` / `Vegan` / `Jain`
- **Smoking** — `Never` / `Occasionally` / `Regularly`
- **Drinking** — `Never` / `Socially` / `Regularly`
- **Family Type** — `Nuclear` / `Joint`
- **Father's Occupation**, **Mother's Occupation** (short text)
- **Photo URL** (single primary photo for MVP)
- **About / Bio** (short paragraph)
- **Partner Preferences** (collapsed substructure): preferred age range, height range, cities, religion, education level

Fields deliberately excluded from MVP: time of birth, place of birth, full Kundli, complexion (regressive), skin tone, blood group.

## 1.8 UX principles

- **Calm, not flashy.** This is a professional ops tool. Neutral palette, generous whitespace, no marketing copy.
- **Density where it counts.** The customer list and suggested-matches list are dense tables; the detail view is spacious.
- **Reasoning is first-class.** Every AI / algorithmic recommendation shows its score *and* its sentence. Never a black box.
- **Reversible actions.** "Send Match" shows a draft for review — never sends silently.
- **Empty states are real.** Every list has a thoughtful empty state explaining what should appear there.
- **Emotionally aware copy.** This is people's lives. No gamified language ("crush", "swipe", "fire") anywhere.

## 1.9 Success metrics (post-MVP, directional)

- M1. Time to send first match for a new customer: target < 10 minutes (vs. ~45 today).
- M2. Match acceptance rate (client agrees to be introduced): track baseline.
- M3. Matchmaker NPS on the tool: > 8/10 after 2 weeks of use.
- M4. % of sent matches with score ≥ 75: track and correlate with M2.

## 1.10 MVP acceptance criteria

The MVP ships when a matchmaker can, in a fresh browser:

1. Log in as a seeded matchmaker
2. See 5+ assigned customers of mixed genders and stages
3. Open a customer, read full biodata, read 10+ ranked suggested matches with AI explanations
4. Add a note
5. Click "Send Match" on any candidate, see a draft email, "send" it, and see the toast + log update
6. Log out

…all without seeing a 500 error or a missing AI fallback.
