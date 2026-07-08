# Sen

**Sen** — nhắc ăn chay theo lịch âm Việt Nam. Monorepo: Spring Boot API, React Native (Expo), Next.js web.

## Structure

```
apps/mobile/     Expo (iOS/Android)
apps/web/        Next.js landing + /app
services/api/    Spring Boot Kotlin API
docs/            PRD, wireframes, tech design, calendar golden vectors
docker-compose.yml   PostgreSQL + Redis (+ API/Web với profile `full`)
```

Chi tiết chạy app: **[docs/RUNNING.md](docs/RUNNING.md)**

## Quick start

### Chỉ database (dev — API/web/mobile chạy trên máy)

```bash
docker compose up -d
```

### Full stack trong Docker (API + Web + DB)

```bash
docker compose --profile full up -d --build
```

Web: http://localhost:3000 · API: http://localhost:8080

### Dev local (khuyến nghị khi code)

```bash
cd services/api
cp .env.example .env   # optional — defaults work with docker compose
./gradlew bootRun
```

Health: http://localhost:8080/actuator/health

### 3. Web

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

### 4. Mobile

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Use your machine LAN IP in `EXPO_PUBLIC_API_URL` for a physical device.

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

Brand: **Sen** · `sen://` deep links · bundle `app.sen.lunar`
