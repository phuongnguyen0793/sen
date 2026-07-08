# Running Sen — Docker & local development

Two common workflows:

| Mode | Best for |
|------|----------|
| **A. Local development** | Editing API / web / mobile code with hot reload |
| **B. Docker full stack** | Quick demos, CI, or machines without Java / Node installed |

The mobile app (Expo) **always runs on the host** — it is not containerized.

---

## Mode A — Local development (recommended)

### Step 1: Start the database (Docker)

```bash
cd /path/to/sen
docker compose up -d
```

This starts **Postgres** on `:5432` and **Redis** on `:6379`.

### Step 2: API (Spring Boot on host)

Requirements: **JDK 21** and the Gradle wrapper in `services/api`.

```bash
cd services/api
./gradlew bootRun
```

- API: http://localhost:8080
- Health: http://localhost:8080/actuator/health

Optional environment variables (defaults match `docker compose`):

```bash
export DB_HOST=localhost DB_PORT=5432 DB_NAME=sen DB_USER=sen DB_PASSWORD=sen
export JWT_SECRET=dev-only-change-me-use-32-chars-minimum!!
export CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Step 3: Web (Next.js on host)

Requirements: **Node ≥ 18.17** (Node 20 recommended).

```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

- Web: http://localhost:3000
- The browser calls `/api/proxy/...` → Next.js rewrite → `http://localhost:8080/api/v1/...`

`.env.local`:

```env
API_URL=http://localhost:8080
NEXT_PUBLIC_API_URL=/api/proxy
```

### Step 4: Mobile (Expo on host)

```bash
cd apps/mobile
npm install
cp .env.example .env
npm start
```

Then press `i` (iOS Simulator) or `a` (Android emulator).

#### API URL by mobile environment

| Environment | `EXPO_PUBLIC_API_URL` |
|-------------|------------------------|
| iOS Simulator (API on same machine) | `http://localhost:8080/api/v1` |
| Android Emulator | `http://10.0.2.2:8080/api/v1` |
| Physical device (same Wi‑Fi) | `http://<your-computer-ip>:8080/api/v1` |

Get your machine IP (macOS):

```bash
ipconfig getifaddr en0
```

Example `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.42:8080/api/v1
```

> `localhost` on a physical device refers to the phone itself — **not** your dev machine.

---

## Mode B — Docker full stack (API + Web in containers)

```bash
cd /path/to/sen
docker compose --profile full up -d --build
```

| Service | URL |
|---------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:8080 |
| Postgres | localhost:5432 |
| Redis | localhost:6379 |

Stop:

```bash
docker compose --profile full down
```

Remove Postgres data as well:

```bash
docker compose --profile full down -v
```

### Mobile when the API runs in Docker

The API is still exposed on host port `8080` — configure mobile the same as **Mode A** (LAN IP, `10.0.2.2`, or `localhost` depending on the emulator).

---

## End-to-end verification

1. Open http://localhost:3000 → sign in or register
2. Go to **Open web app** → confirm today's status and the calendar
3. Mobile: sign in with the same account → **Today** tab

Direct API checks:

```bash
curl -s http://localhost:8080/actuator/health

curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@sen.local","password":"password123","displayName":"Demo"}'
```

---

## Connection diagram (local development)

```
┌─────────────┐     /api/proxy      ┌──────────────┐
│  Web :3000  │ ──────────────────► │  API :8080   │
│  (Next.js)  │                     │ (Spring Boot)│
└─────────────┘                     └──────┬───────┘
                                           │
┌─────────────┐   EXPO_PUBLIC_API_URL      │
│ Mobile Expo │ ───────────────────────────┤
│  (host)     │   http://IP:8080/api/v1    │
└─────────────┘                            ▼
                                  ┌────────────────┐
                                  │ docker compose │
                                  │ postgres:5432  │
                                  │ redis:6379     │
                                  └────────────────┘
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API won't start — DB connection refused | Run `docker compose up -d` and wait for Postgres to become healthy |
| Web 401/403 when calling API | Sign in again; check `API_URL` in `.env.local` |
| Mobile can't reach API | Set `EXPO_PUBLIC_API_URL` to your LAN IP; ensure port 8080 isn't blocked |
| CORS error from web | Add your origin to `CORS_ORIGINS` when starting the API |
| Slow first `bootRun` | Normal — Gradle downloads dependencies on first run |
