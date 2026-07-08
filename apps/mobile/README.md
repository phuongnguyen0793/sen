# Sen Mobile

React Native (Expo) shell — auth, Home (today), Settings (fasting/reminders).

**Languages:** English + Vietnamese (`src/lib/i18n/`). Use the **EN | VI** toggle on login and in Settings. Preference is stored in SecureStore under `sen.locale`.

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

## i18n

| File | Role |
|------|------|
| `src/lib/i18n/messages/en.ts` | English strings |
| `src/lib/i18n/messages/vi.ts` | Vietnamese strings |
| `src/lib/i18n/I18nProvider.tsx` | `useI18n()` hook + persistence |
| `src/components/LanguageSwitcher.tsx` | EN \| VI control |

Add a key to **both** `en.ts` and `vi.ts` when introducing new UI copy. Keep key namespaces aligned with `apps/web` where screens overlap.
