# Tech Design — Sen

**Stack:** Spring Boot (Kotlin) · React Native · Next.js · PostgreSQL · Redis  
**API version:** `/api/v1`  
**Assumptions:** see `PRODUCT_ASSUMPTIONS.md`

---

## 1. Architecture overview

```
┌────────────────┐   ┌────────────────┐
│ React Native   │   │ Next.js (App)  │
│ iOS + Android  │   │ + Marketing /  │
└───────┬────────┘   │   /app/*       │
        │            └───────┬────────┘
        │   HTTPS JWT        │
        └─────────┬──────────┘
                  ▼
        ┌─────────────────────┐
        │ Spring Boot API     │
        │ Auth · Calendar ·   │
        │ Profile · Recipes · │
        │ AI Proxy · Devices  │
        └─────────┬───────────┘
     ┌────────────┼────────────┐
     ▼            ▼            ▼
 PostgreSQL     Redis       AI Provider
                  │          (OpenAI)
                  ▼
        ┌─────────────────────┐
        │ Notification Worker │
        │ schedule → APNs/FCM │
        └─────────────────────┘
```

**Calendar module** is a pure Kotlin library (`:calendar`) with no Spring/UI deps — consumed by API and covered by golden tests in CI.

---

## 2. Repository layout (monorepo)

```
chay-nhac/
├── apps/
│   ├── mobile/          # React Native (TypeScript)
│   └── web/             # Next.js App Router
├── services/
│   └── api/             # Spring Boot Kotlin
│       ├── src/main/...
│       └── src/test/... # includes calendar golden tests
├── packages/
│   └── calendar-vn/     # optional shared TS port for client display
│                        # OR client calls API only (MVP: API-authoritative)
├── docs/
│   ├── PRODUCT_ASSUMPTIONS.md
│   ├── WIREFRAMES.md
│   ├── TECH_DESIGN.md   # this file
│   └── calendar/
│       └── golden-vectors.json
├── docker-compose.yml   # postgres + redis
└── README.md
```

**MVP calendar strategy:** Server is source of truth. Mobile/web may cache month payloads. A pure Kotlin implementation lives under `services/api/.../calendar`. Golden vectors in `docs/calendar/golden-vectors.json` are loaded by JVM tests.

---

## 3. Backend modules (Spring Boot)

| Package | Responsibility |
|---------|----------------|
| `auth` | Register/login, Apple/Google OIDC, JWT access + refresh rotation |
| `user` | Profile, timezone, export/delete account |
| `device` | Device push tokens (APNs/FCM), permission flag |
| `fasting` | FastingProfile, FastingRule, ReminderPreference |
| `calendar` | Lunar↔solar VN, month grid DTO, upcoming fasting days |
| `checkin` | CheckIn CRUD, streak computation |
| `recipe` | Curated recipes, tags, bookmarks |
| `ai` | Rate-limited OpenAI proxy, structured recipe JSON, logging |
| `notify` | Enqueue reminder jobs; worker sends push |
| `admin` | Feature flags, recipe CRUD (basic) |
| `common` | errors, paging, clock/timezone helpers |

### 3.1 Key domain rules

- All “local dates” for fasting/check-in use `user.timezone` (default `Asia/Ho_Chi_Minh`).
- Reminder “evening before” = local date `fastingDate - 1 day` at configured `LocalTime`.
- Dedupe key: `{userId}:{fastingDate}:{slotId}` → unique in `notification_log`.
- Changing `FastingProfile` / reminders triggers reschedule of pending jobs (next 60 days window).

---

## 4. Data model (PostgreSQL)

```sql
-- Conceptual schema (Flyway migrations in implementation)

users (
  id UUID PK,
  display_name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT NULL,          -- null if OAuth-only
  timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  locale TEXT NOT NULL DEFAULT 'vi-VN',
  prefer_no_onion_garlic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ NULL
)

auth_identities (
  id UUID PK,
  user_id UUID FK,
  provider TEXT,                    -- password|apple|google
  provider_subject TEXT,
  UNIQUE(provider, provider_subject)
)

refresh_tokens (
  id UUID PK,
  user_id UUID FK,
  token_hash TEXT,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ NULL
)

device_tokens (
  id UUID PK,
  user_id UUID FK,
  platform TEXT,                    -- ios|android
  token TEXT,
  notifications_enabled BOOLEAN,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, token)
)

fasting_profiles (
  id UUID PK,
  user_id UUID UNIQUE FK,
  preset TEXT,                      -- MUNG_1|DAY_15|MUNG_1_AND_15|CUSTOM
  updated_at TIMESTAMPTZ
)

fasting_rules (
  id UUID PK,
  profile_id UUID FK,
  type TEXT,                        -- LUNAR_DAY|WEEKDAY
  lunar_day INT NULL,               -- 1..30
  weekday INT NULL                  -- Phase 1 health mode
)

reminder_preferences (
  id UUID PK,
  profile_id UUID FK,
  slot_key TEXT,                    -- EVE_BEFORE|MORNING|FOLLOWUP
  enabled BOOLEAN,
  offset_days INT,                  -- -1 for eve, 0 for day-of
  local_time TIME,
  UNIQUE(profile_id, slot_key)
)

check_ins (
  id UUID PK,
  user_id UUID FK,
  local_date DATE,                  -- in user TZ
  status TEXT,                      -- DONE|MISSED|N_A
  note TEXT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, local_date)
)

recipes (
  id UUID PK,
  title TEXT,
  ingredients JSONB,
  steps JSONB,
  cook_minutes INT,
  servings INT,
  tags TEXT[],                      -- vegan, niem, easy, ...
  source TEXT,                      -- curated|ai
  created_at TIMESTAMPTZ
)

bookmarks (
  user_id UUID FK,
  recipe_id UUID FK,
  PRIMARY KEY(user_id, recipe_id)
)

ai_generations (
  id UUID PK,
  user_id UUID FK,
  prompt_meta JSONB,                -- no PII
  result_recipe_id UUID NULL,
  tokens_in INT,
  tokens_out INT,
  cost_micros BIGINT,
  created_at TIMESTAMPTZ
)

notification_log (
  id UUID PK,
  user_id UUID FK,
  fasting_date DATE,
  slot_key TEXT,
  dedupe_key TEXT UNIQUE,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NULL,
  status TEXT,                      -- PENDING|SENT|FAILED|CANCELLED
  error TEXT NULL
)

feature_flags (
  key TEXT PK,
  enabled BOOLEAN,
  payload JSONB                     -- e.g. ai_daily_limit: 2
)
```

Indexes: `notification_log(status, scheduled_at)`, `check_ins(user_id, local_date)`, `ai_generations(user_id, created_at)`.

---

## 5. API surface (`/api/v1`)

### Auth
| Method | Path | Notes |
|--------|------|-------|
| POST | `/auth/register` | email+password |
| POST | `/auth/login` | → access + refresh |
| POST | `/auth/oauth/{apple\|google}` | id_token verify |
| POST | `/auth/refresh` | rotate refresh |
| POST | `/auth/logout` | revoke refresh |

### User
| Method | Path | Notes |
|--------|------|-------|
| GET | `/me` | profile |
| PATCH | `/me` | name, timezone, niem pref |
| GET | `/me/export` | JSON dump |
| DELETE | `/me` | soft-delete + purge PII schedule |

### Devices
| Method | Path | Notes |
|--------|------|-------|
| PUT | `/devices/push-token` | register/update |
| PATCH | `/devices/notification-status` | OS permission mirror |

### Fasting & reminders
| Method | Path | Notes |
|--------|------|-------|
| GET | `/fasting/profile` | rules + slots |
| PUT | `/fasting/profile` | replace rules/preset |
| PUT | `/fasting/reminders` | replace slots → reschedule |

### Calendar
| Method | Path | Notes |
|--------|------|-------|
| GET | `/calendar/month?year=&month=` | solar grid + lunar + `isFasting` |
| GET | `/calendar/today` | today status in user TZ |
| GET | `/calendar/upcoming?days=30` | next fasting dates |

### Check-ins
| Method | Path | Notes |
|--------|------|-------|
| PUT | `/check-ins/{localDate}` | upsert status/note |
| GET | `/check-ins?from=&to=` | range |
| GET | `/stats/streak` | current + best |

### Recipes & AI
| Method | Path | Notes |
|--------|------|-------|
| GET | `/recipes` | filter tags, cook_minutes |
| GET | `/recipes/{id}` | detail |
| POST | `/recipes/{id}/bookmark` | |
| DELETE | `/recipes/{id}/bookmark` | |
| POST | `/ai/recipes` | rate-limited; SSE or JSON |
| GET | `/ai/quota` | remaining today |

### Admin (role-gated)
| Method | Path | Notes |
|--------|------|-------|
| CRUD | `/admin/recipes` | |
| GET/PATCH | `/admin/flags/{key}` | |

**Error shape:** `{ "code": "AI_QUOTA_EXCEEDED", "message": "..." }`

---

## 6. Calendar module (critical)

### Responsibilities
- `SolarDate` ↔ `LunarDate(year, month, day, leapMonth: Boolean)` per Vietnamese calendar
- Month view: for each solar day in month, attach lunar label
- `isFasting(solar, rules)` for LUNAR_DAY rules
- Leap month handling must match golden vectors

### Implementation notes
- Prefer a well-known VN algorithm (Ho Ngoc Duc style tables / equivalent) ported to Kotlin — **not** a mainland-China-only lib unless vectors match VN.
- Fixed `Clock` injection in tests.
- CI job: `./gradlew :api:test --tests '*LunarCalendarGoldenTest'` must pass.

### Client
- Displays server-provided `lunarDay`, `lunarMonth`, `leap`, `isFasting`.
- Optional local preview only if packages/calendar-vn is kept in sync later.

---

## 7. Notification worker

### Flow
1. On profile/reminder change OR nightly planner: compute fasting dates for next **60 days**.
2. For each date × enabled slot → upsert `notification_log` PENDING with `scheduled_at` = instant in user TZ.
3. Worker polls / uses Redis ZSET by `scheduled_at`:
   - claim job (atomic)
   - load device tokens
   - send APNs (iOS) / FCM (Android)
   - mark SENT / FAILED
4. Cancel PENDING rows when rules change and date no longer fasting.

### Push payload
```json
{
  "title": "Sen",
  "body": "Ngày mai là mùng 1 tháng 7 — nhớ ăn chay nhé.",
  "data": {
    "type": "FASTING_REMINDER",
    "fastingDate": "2026-07-22",
    "deepLink": "sen://home"
  }
}
```

### Reliability
- Idempotent via `dedupe_key`
- Retry with backoff on FAILED (max 3)
- Metrics: `push_sent_total`, `push_failed_total`, `jobs_lag_seconds`

### Mobile local fallback (P1)
- After sync, schedule local notifications for next N fasting days; server remains authoritative when online.

---

## 8. AI recipe proxy

1. Check feature flag `ai_recipes_enabled`
2. Check daily quota (default 2) via count of `ai_generations` since local midnight
3. Build system prompt: vegetarian/vegan VN cuisine; honor `prefer_no_onion_garlic` and allergy tags; JSON schema response
4. Call OpenAI; validate schema; reject if meat/fish keywords in ingredients (post-filter)
5. Persist as `recipes(source=ai)` + `ai_generations`
6. On failure → return HTTP 503 with `fallbackRecipeIds[]` from curated

**Streaming:** prefer SSE for mobile TTFT; web may use non-stream JSON in MVP.

---

## 9. Auth & security

- Access JWT ~15m; refresh ~30d, hashed at rest, rotation on use
- Password: Argon2id or BCrypt
- Apple/Google: verify aud/iss/nonce server-side
- HTTPS only; secrets in env / secret manager
- AI keys never on client
- Rate limit: auth endpoints, AI endpoints (bucket per user)
- Account deletion: anonymize within retention SLA (target 30 days hard purge)

---

## 10. Mobile (React Native)

| Area | Approach |
|------|----------|
| Nav | React Navigation — tabs per wireframes |
| State | Query client for API; secure storage for tokens |
| Push | `@react-native-firebase/messaging` + APNs setup |
| Offline | Cache month + queue check-ins (AsyncStorage / SQLite) |
| Deep link | `sen://` from notifications |
| i18n | `vi` strings file; structure for `en` later |

Screens map 1:1 to `WIREFRAMES.md`.

---

## 11. Web (Next.js)

| Area | Approach |
|------|----------|
| Router | App Router |
| Auth | Cookie/BFF session wrapping API refresh — or store tokens httpOnly via Route Handlers |
| `/` | Marketing landing |
| `/app/*` | Calendar + reminders (SSR or client fetch) |
| Recipes | Curated list; AI optional |
| SEO | Metadata on landing; `/blog` stub |

Parity: thinner than mobile — no requirement for full offline.

---

## 12. Infra & ops (MVP)

- `docker-compose`: Postgres 16, Redis 7
- Deploy API + worker as two processes (same artifact, different main/command)
- Health: `/actuator/health`
- Metrics: Micrometer → Prometheus/log
- Logging: JSON structured; redact emails/tokens
- Feature flags in DB with admin API + emergency env override `AI_DISABLED=true`

### NFR mapping
| NFR | Mechanism |
|-----|-----------|
| API p95 &lt; 300ms | Cache month responses briefly in Redis; indexed reads |
| Availability 99.5% | Single region OK for MVP; health checks; restart policies |
| Push idempotency | `dedupe_key` unique |
| Calendar zero critical bugs | Golden vector suite blocking CI |

---

## 13. CI pipeline

1. Lint Kotlin + ESLint TS
2. Unit tests + **LunarCalendarGoldenTest**
3. Build API jar; typecheck mobile/web
4. (Optional) docker-compose smoke: migrate + health

---

## 14. Implementation sequence (suggested)

1. `calendar` module + golden vectors green
2. Auth + users + fasting profile API
3. Calendar endpoints wired to module
4. Notification planner + worker + device tokens
5. Check-in + streak
6. Recipes curated seed + AI stub/quota
7. RN app shells per wireframes
8. Next.js landing + `/app` thin parity
9. Feature flags + observability
10. App Store privacy + Sign in with Apple polish

---

## 15. OpenAPI

Publish `services/api/openapi.yaml` during implementation from Springdoc or hand-maintained contract. Mobile/web generate types from OpenAPI when stable.

---

## 16. Risks (engineering)

| Risk | Mitigation |
|------|------------|
| Wrong lunar dates | Golden vectors + dual review of leap years |
| Push delivery on iOS | Early APNs cert/key setup; staging device matrix |
| OAuth review delays | Start Apple/Google console setup in parallel with API |
| AI cost spikes | Flag kill-switch + hard daily user cap + monthly alert |
