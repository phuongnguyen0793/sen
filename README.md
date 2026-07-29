# Sen

**Sen** is a lunar fasting companion for the Vietnamese calendar. It helps you track vegetarian fasting days (first day of the month, full moon, and custom rules) with reminders across mobile and web.

**Languages:** English and Vietnamese UI — switch with **EN | VI** in the app (see [TECH_DESIGN.md](docs/TECH_DESIGN.md#17-internationalization-i18n)).

Monorepo: Spring Boot API, React Native (Expo), and Next.js web.

## Structure

```
apps/mobile/       Expo (iOS / Android)
apps/web/          Next.js landing + /app
services/api/      Spring Boot Kotlin API
docs/              PRD, wireframes, tech design, calendar golden vectors
docker-compose.yml PostgreSQL + Redis (+ API / Web with profile `full`)
```

For more detail (Docker full stack, troubleshooting, connection diagram), see **[docs/RUNNING.md](docs/RUNNING.md)**.

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | Desktop / Compose |
| JDK | **21** (API) |
| Node.js | **≥ 18.17** (20 recommended) — web & mobile |
| Expo Go / Simulator | optional, for mobile |

## Run locally (web + mobile + API)

Recommended while coding: **Postgres/Redis in Docker**, API / Web / Mobile on your machine.

### 1. Database

```bash
docker compose up -d
```

Starts **Postgres** (`:5432`) and **Redis** (`:6379`).

### 2. API

```bash
cd services/api
cp .env.example .env   # optional — defaults match docker compose
./gradlew bootRun
```

- API: http://localhost:8080
- Health: http://localhost:8080/actuator/health

### 3. Web

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

Browser calls `/api/proxy/*` → Spring Boot `http://localhost:8080/api/v1/*`.

### 4. Mobile

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Then press `i` (iOS Simulator) or `a` (Android emulator), or scan the QR with Expo Go.

| Environment | `EXPO_PUBLIC_API_URL` in `.env` |
|-------------|----------------------------------|
| iOS Simulator | `http://localhost:8080/api/v1` |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| Physical device (same Wi‑Fi) | `http://<your-LAN-IP>:8080/api/v1` |

macOS LAN IP:

```bash
ipconfig getifaddr en0
```

### Full stack in Docker (optional)

API + Web + DB without installing JDK/Node for those services:

```bash
docker compose --profile full up -d --build
```

- Web: http://localhost:3000
- API: http://localhost:8080

Mobile still runs on the host (step 4 above).

## Test account

There is **no seeded user** — create one once (API must be running), then reuse it on web and mobile.

**Credentials**

| Field | Value |
|-------|--------|
| Email | `mobile@test.com` |
| Password | `password123` |

### Create via API (curl)

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"mobile@test.com","password":"password123","displayName":"Mobile Test"}'
```

If the email already exists you get `EMAIL_EXISTS` — just log in instead.

### Create / sign in via UI

1. Open http://localhost:3000/login (web) **or** the Login screen on mobile.
2. Switch to **Register**, enter `mobile@test.com` / `password123`, submit.
3. Next time use **Sign in** with the same credentials on web or mobile.

### Verify login via API

```bash
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"mobile@test.com","password":"password123"}'
```

## API (MVP scaffold)

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout` |
| User | `GET/PATCH/DELETE /api/v1/me` |
| Fasting | `GET/PUT /api/v1/fasting/profile`, `PUT /api/v1/fasting/reminders` |
| Calendar | `GET /api/v1/calendar/today`, `/month`, `/upcoming` |

OpenAPI: [services/api/openapi.yaml](services/api/openapi.yaml)

## Tests

```bash
# API (146 tests incl. lunar golden vectors)
cd services/api && ./gradlew test

# Calendar vectors (no JVM)
python3 docs/calendar/verify_vectors.py

# Web typecheck + build
cd apps/web && npx tsc --noEmit && npm run build

# Mobile typecheck
cd apps/mobile && npm run lint
```

## Docs

- [PRODUCT_ASSUMPTIONS.md](docs/PRODUCT_ASSUMPTIONS.md) — brand **Sen**, auth, AI
- [TECH_DESIGN.md](docs/TECH_DESIGN.md)
- [WIREFRAMES.md](docs/WIREFRAMES.md)
- [FEATURES.md](docs/FEATURES.md) — functionality tracker (backend / web / mobile)
- [RUNNING.md](docs/RUNNING.md) — local Docker & development
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — publish API, web, and iOS

**Brand:** Sen · deep links `sen://` · bundle ID `app.sen.lunar`
