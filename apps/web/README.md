# Sen Web

Next.js App Router — landing, login, thin `/app` parity (today, calendar, reminders).

**Languages:** English + Vietnamese (`src/lib/i18n/`). Use the **EN | VI** toggle on landing, login, and app screens. Preference is stored in `localStorage` under `sen.locale`.

## Setup

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## API proxy

Browser calls `/api/proxy/*` → Spring Boot `http://localhost:8080/api/v1/*` (see `next.config.js`).

## i18n

| File | Role |
|------|------|
| `src/lib/i18n/messages/en.ts` | English strings |
| `src/lib/i18n/messages/vi.ts` | Vietnamese strings |
| `src/lib/i18n/I18nProvider.tsx` | `useI18n()` hook + persistence |
| `src/components/LanguageSwitcher.tsx` | EN \| VI control |

Add a key to **both** `en.ts` and `vi.ts` when introducing new UI copy.
