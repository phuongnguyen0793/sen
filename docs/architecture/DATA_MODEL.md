# Database relationship diagram

**Source of truth (shipped):** [`V1__init.sql`](../../services/api/src/main/resources/db/migration/V1__init.sql)  
**Conceptual / planned tables:** [TECH_DESIGN.md §4](./TECH_DESIGN.md#4-data-model-postgresql)

This page documents **relationships currently applied by Flyway**. Tables listed only in tech design (e.g. `device_tokens`, `check_ins`, `notification_log`) are **not** in the diagram until migrations land.

---

## Entity relationship (current)

```mermaid
erDiagram
  users ||--o{ auth_identities : "has"
  users ||--o{ refresh_tokens : "has"
  users ||--|| fasting_profiles : "has"
  fasting_profiles ||--o{ fasting_rules : "defines"
  fasting_profiles ||--o{ reminder_preferences : "schedules"

  users {
    uuid id PK
    text display_name
    text email UK
    text password_hash "nullable OAuth-only"
    text timezone
    text locale
    boolean prefer_no_onion_garlic
    timestamptz created_at
    timestamptz deleted_at "nullable soft-delete"
  }

  auth_identities {
    uuid id PK
    uuid user_id FK
    text provider "PASSWORD|APPLE|GOOGLE"
    text provider_subject
  }

  refresh_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash UK
    timestamptz expires_at
    timestamptz revoked_at "nullable"
  }

  fasting_profiles {
    uuid id PK
    uuid user_id FK_UK
    text preset "MUNG_1|DAY_15|MUNG_1_AND_15|CUSTOM"
    timestamptz updated_at
  }

  fasting_rules {
    uuid id PK
    uuid profile_id FK
    text type "LUNAR_DAY|WEEKDAY"
    int lunar_day "nullable 1..30"
    int weekday "nullable"
  }

  reminder_preferences {
    uuid id PK
    uuid profile_id FK
    text slot_key "EVE_BEFORE|MORNING|FOLLOWUP"
    boolean enabled
    int offset_days
    time local_time
  }
```

---

## Cardinality (summary)

| Parent | Child | Relationship | Notes |
|--------|-------|--------------|-------|
| `users` | `auth_identities` | 1 → N | Cascade delete; unique `(provider, provider_subject)` |
| `users` | `refresh_tokens` | 1 → N | Cascade delete; `token_hash` unique |
| `users` | `fasting_profiles` | 1 → 1 | `user_id` unique; cascade delete |
| `fasting_profiles` | `fasting_rules` | 1 → N | Cascade delete; lunar/weekday rules for calendar |
| `fasting_profiles` | `reminder_preferences` | 1 → N | Cascade delete; unique `(profile_id, slot_key)` |

---

## Indexes (V1)

- `idx_refresh_tokens_user` on `refresh_tokens(user_id)`
- `idx_fasting_rules_profile` on `fasting_rules(profile_id)`

---

## Planned (not migrated yet)

From [TECH_DESIGN.md](./TECH_DESIGN.md) / notifications spec — expect future FKs to `users` (or profiles) for:

- `device_tokens`
- `check_ins`
- `notification_log` (and related planner tables)

Add them to this diagram when the corresponding Flyway migration ships.
