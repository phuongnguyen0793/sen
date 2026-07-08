# Sen Mobile

React Native (Expo) shell — auth, Home (today), Settings (fasting/reminders).

## Setup

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` to your API (use machine LAN IP for physical device).

## Deep link

Scheme: `sen://` (see `app.json`).
