# 14. Mobile App Spec

**Project:** KnotWise  
**Version:** 2.0  
**Status:** Approved  
**Phase:** P8

---

## 14.1 Stack

- **Expo SDK 52+** in [`apps/mobile/`](../apps/mobile/)
- Shared types: `@knotwise/types`
- API client: `@knotwise/api-client`
- Auth: Bearer token via `POST /api/auth/token` (matchmaker) + client token endpoint P8

---

## 14.2 Screen map

| Screen | Portal parity | Priority |
|--------|---------------|----------|
| Login / magic link | `/portal/login` | P0 |
| Onboarding | `/portal/onboarding` | P0 |
| Home | `/portal` | P0 |
| Intros list | `/portal/matches` | P0 |
| Intro detail | P3 limited/full reveal | P0 |
| C2C chat | P4 | P0 |
| Profile edit | P2 | P1 |
| Discover | P9 | P2 |
| Delegate view | P10 | P2 |
| Settings / notifications | P7 | P1 |

---

## 14.3 Navigation

Bottom tab bar: Home | Intros | Chat | Profile (see Design §6.14).

---

## 14.4 Auth & storage

- `expo-secure-store` for tokens
- Refresh on 401 → re-login flow
- Biometric unlock optional P8.1

---

## 14.5 Push notifications (P7)

- Expo Notifications → FCM (Android) / APNs (iOS)
- Register token: `POST /api/client/devices`
- Handle foreground + background taps → deep link

---

## 14.6 Deep links

| Path | Action |
|------|--------|
| `knotwise://portal/verify?token=` | Verify email |
| `knotwise://portal/matches/:id` | Open intro |
| `knotwise://portal/chat/:id` | Open C2C |

Universal links: `https://app.knotwise.in/...`

---

## 14.7 Store checklist

- [ ] Apple Developer + Google Play accounts
- [ ] Privacy nutrition labels
- [ ] Screenshots (6.5" + 6.7")
- [ ] EAS Build profiles: `preview`, `production`
- [ ] TestFlight / Internal testing 2 weeks

---

## Scope

Store-ready iOS/Android with portal parity for core flows.

## Non-goals

Matchmaker full console on mobile (read-only client list optional later).

## Acceptance criteria

- [ ] TestFlight build passes Apple review guidelines
- [ ] Login → intro → chat works on device

## Open questions

- React Native New Architecture default?
