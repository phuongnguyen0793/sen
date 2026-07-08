# Sen Web

Next.js App Router — landing, login, thin `/app` parity (today, calendar, reminders).

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
