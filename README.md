# Sen

**Sen** is a lunar fasting companion for the Vietnamese calendar. It helps you track vegetarian fasting days (first day of the month, full moon, and custom rules) with reminders across mobile and web.

Monorepo: Spring Boot API, React Native (Expo), and Next.js web.

## Structure

```
apps/mobile/       Expo (iOS / Android)
apps/web/          Next.js landing + /app
services/api/      Spring Boot Kotlin API
docs/              PRD, wireframes, tech design, calendar golden vectors
docker-compose.yml PostgreSQL + Redis (+ API / Web with profile `full`)
```

For detailed setup instructions, see **[docs/RUNNING.md](docs/RUNNING.md)**.

## Quick start

### Database only (local dev — run API / web / mobile on your machine)

```bash
docker compose up -d
```

### Full stack in Docker (API + Web + DB)

```bash
docker compose --profile full up -d --build
```

- Web: http://localhost:3000
- API: http://localhost:8080

### Local development (recommended while coding)

**API**

```bash
cd services/api
cp .env.example .env   # optional — defaults work with docker compose
./gradlew bootRun
```

Health check: http://localhost:8080/actuator/health

**Web**

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

**Mobile**

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` to your machine's LAN IP when testing on a physical device.

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
```

## Docs

- [PRODUCT_ASSUMPTIONS.md](docs/PRODUCT_ASSUMPTIONS.md) — brand **Sen**, auth, AI
- [TECH_DESIGN.md](docs/TECH_DESIGN.md)
- [WIREFRAMES.md](docs/WIREFRAMES.md)

**Brand:** Sen · deep links `sen://` · bundle ID `app.sen.lunar`
