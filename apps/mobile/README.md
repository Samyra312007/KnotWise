# KnotWise Mobile (P8)

Expo client app with portal parity for core dating flows.

## Setup

```bash
cd apps/mobile
npm install
```

Set API URL for your machine when testing against local backend:

```powershell
$env:EXPO_PUBLIC_API_URL="http://YOUR_LAN_IP:3000"
npm start
```

Android emulator can use `http://10.0.2.2:3000`.

## Flows

- Magic link login → bearer token stored in SecureStore
- Onboarding wizard (same API as web portal)
- Home, intros list/detail with accept/decline
- C2C chat list and conversation
- Profile edit, matchmaker thread, notification preferences
- Push token registration on sign-in
- Deep links: `knotwise://portal/verify?token=...`, push tap navigation

## EAS builds

```bash
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform ios
```

Profiles live in `eas.json`.
