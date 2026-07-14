# Specification — Custom fasting days & notifications

**Status:** Draft for implementation  
**Product:** Sen  
**Date:** 2026-07-14  
**Related:** [WIREFRAMES.md](./WIREFRAMES.md) (CAL-03, REM-01, REM-05), [TECH_DESIGN.md](./TECH_DESIGN.md) §5–7, [FEATURES.md](./FEATURES.md), [PRODUCT_ASSUMPTIONS.md](./PRODUCT_ASSUMPTIONS.md)

---

## 1. Problem

Today users can only pick **3 fixed lunar presets** (mùng 1 / rằm / both). Reminders store times, but **nothing is delivered** to the phone. Wireframes and backend already intend **custom lunar days** and **push**, but clients and delivery are incomplete.

Users want:

1. Choose **any lunar day(s)** for fasting (not only the 3 presets).
2. Get **notifications** at the times they configure.

---

## 2. Current state (analysis)

### 2.1 What works today

| Layer | Behavior |
|-------|----------|
| Backend presets | `MUNG_1`, `DAY_15`, `MUNG_1_AND_15`, **`CUSTOM`** |
| Custom rules API | `PUT /fasting/profile` with `{ preset: "CUSTOM", customLunarDays: [1,15,23] }` — **implemented** |
| Calendar | `isFasting` derived from stored `fasting_rules` (lunar days) |
| Reminder prefs | `PUT /fasting/reminders` — enable + `localTime` for slots `EVE_BEFORE`, `MORNING`, `FOLLOWUP` |
| Web + Mobile UI | Only 3 presets; reminder toggles + time pickers |

### 2.2 What does **not** work

| Gap | Detail |
|-----|--------|
| Custom days UI | No “Tự chọn ngày âm…” sheet; web never sends `customLunarDays` |
| Weekday rules | Schema supports `WEEKDAY`; **out of this spec’s MVP** |
| Device tokens | No `device_tokens` table / API |
| Notification planner | No `notification_log`, no worker |
| Push (APNs/FCM) | Not implemented |
| OS permission UX | No request flow, no REM-05 banner |
| Reschedule on change | Profile/reminder PUT does not enqueue/cancel jobs |

### 2.3 Mental model

```
TODAY
  Preset (3) → fasting_rules → calendar highlighting
  Reminder prefs → stored only (no delivery)

TARGET
  Preset (3) OR CUSTOM lunar days → fasting_rules → calendar
  Reminder prefs + user timezone → schedule jobs → notify device
```

---

## 3. Goals & non-goals

### Goals (this initiative)

1. **G1 — Custom lunar days:** Users pick one or more lunar days `1…30`; calendar & reminders use those days.
2. **G2 — Deliver reminders:** User receives a notification for each enabled reminder slot relative to each fasting day.
3. **G3 — Editable times:** Keep enable + HH:mm per slot (already done); scheduling must respect them.
4. **G4 — Permission honesty:** Mobile asks for notification permission; if denied, show recoverable UI (REM-05).

### Non-goals (defer)

- “Chay trường” / every-day mode (Phase 1+ per product assumptions).
- Solar-date one-offs (“remind me only next Tuesday”) as first-class rules.
- Weekday-based fasting rules UI (backend column exists; not in MVP of this spec).
- Web browser push (web stays prefs + calendar only).
- Check-in gating of `FOLLOWUP` (slot may exist; copy stays simple).
- Rich media / actionable notification buttons beyond open app.

---

## 4. Product definition

### 4.1 Fasting schedule modes

| Mode | `preset` | Rules |
|------|----------|--------|
| First day only | `MUNG_1` | Lunar day `1` |
| Full moon only | `DAY_15` | Lunar day `15` |
| First + full moon | `MUNG_1_AND_15` | `1` and `15` |
| **Custom** | `CUSTOM` | User-selected set of lunar days ∈ `1..30`, **≥ 1 day**, deduped, sorted |

**Invariant:** Switching from a fixed preset to Custom **pre-fills** selection with that preset’s days (e.g. mùng 1 + 15 → chips `1`, `15` selected) so users expand rather than start blank.

**Validation:**

- Empty selection → client blocks save; server already rejects empty `CUSTOM`.
- Days outside `1..30` → reject.
- Max days: **30** (all allowed); recommend soft UX hint if > 10 (“many reminders”).

### 4.2 Reminder slots (unchanged keys)

| `slotKey` | Default | `offsetDays` | Meaning | Body hint (VI) |
|-----------|---------|--------------|---------|----------------|
| `EVE_BEFORE` | on @ 20:00 | `-1` | Evening before fasting day | “Ngày mai là … — nhớ ăn chay nhé.” |
| `MORNING` | on @ 07:00 | `0` | Morning of fasting day | “Hôm nay là ngày chay …” |
| `FOLLOWUP` | off @ 12:00 | `0` | Later same day (optional) | “Nhắc lại: hôm nay ngày chay.” |

Users may change **enabled** and **localTime** only. **offsetDays** stay fixed per slot in MVP (no free-form “2 days before” yet).

### 4.3 What “notification” means (phased delivery)

| Phase | Mechanism | When to ship |
|-------|-----------|--------------|
| **A** | Custom days UI + API wiring | Immediately (backend ready) |
| **B** | **Local** notifications on iOS/Android via `expo-notifications` | Fastest user-visible notify; needs **dev build** for reliable iOS push permission |
| **C** | **Remote** push: devices API + planner + APNs/Expo Push | Multi-device, survives reinstall, authoritative server schedule |

**Recommendation:** Ship **A → B → C**. Phase B gives value without Redis/worker; Phase C matches [TECH_DESIGN.md](./TECH_DESIGN.md) §7 and replaces client-only scheduling when online.

Local (B) and remote (C) must share the **same** schedule math so migration is seamless.

---

## 5. User experience

### 5.1 Settings — schedule section (mobile + web)

Extend radio list (wireframe CAL-03):

```
○ Chỉ mùng 1
○ Chỉ rằm (15)
○ Mùng 1 và rằm
○ Tự chọn ngày âm…     ← NEW
```

Selecting **Tự chọn** opens sheet/panel:

```
Chọn ngày âm
[1] [2] … [15] … [30]     // multi-select chips
Đã chọn: 1, 15, 23
[Xong] / [Hủy]
```

**After Done:**

- Client `PUT /fasting/profile` with `{ preset: "CUSTOM", customLunarDays: [...] }`.
- Show summary under radios: e.g. `Đang theo: 1, 15, 23` (EN: `Custom: 1, 15, 23`).
- Calendar Today/Month refresh so highlights match new rules.

**Re-open Custom:** sheet shows currently saved days.

**Switch from Custom → fixed preset:** confirm if selection differs (“Đổi sang mùng 1 & rằm? Ngày tự chọn sẽ bỏ.”) then `PUT` preset only.

### 5.2 Settings — reminder times (existing + small tweaks)

Keep three slot rows. Copy updates when Custom:

- Hint under times: “Nhắc theo lịch bạn đã chọn (ngày âm …).”
- Example sentence uses first upcoming fasting day when possible (optional nicety).

### 5.3 Notification permission (mobile, Phase B/C)

| Moment | Behavior |
|--------|----------|
| First save of any **enabled** reminder, or first open after enabling | Request OS permission |
| Granted | Store status; register push token (Phase C) / schedule local (Phase B) |
| Denied | Show REM-05 banner on Home: “Thông báo đang tắt — bật trong Cài đặt để được nhắc.” + deep link to system Settings |
| Provisional / temporary (iOS) | Treat as partial; still schedule; re-prompt once later if needed |

Web: no OS push; after save show toast: “Đã lưu. Mở app Sen trên điện thoại để nhận nhắc.”

### 5.4 Notification content

| Field | Rule |
|-------|------|
| Title | Always **Sen** |
| Body | Localized by `user.locale` (`vi-VN` / `en-US`); fall back to app EN\|VI if `/me` not synced yet |
| Deep link | `sen://home` |
| Data | `{ type: "FASTING_REMINDER", fastingDate: "YYYY-MM-DD", slotKey }` |

**VI examples**

- Eve: `Ngày mai là mùng {d} tháng {m} — nhớ ăn chay nhé.`
- Morning: `Hôm nay là ngày chay (mùng {d} tháng {m}).`
- Custom day without special name: `Ngày mai là ngày {d} âm lịch — nhớ ăn chay nhé.`

**EN examples**

- Eve: `Tomorrow is lunar day {d} — remember to fast.`
- Morning: `Today is a fasting day (lunar day {d}).`

Leap month: append “(tháng nhuận)” / “(leap month)” when server flags leap.

---

## 6. Scheduling algorithm (shared by B & C)

Inputs:

- User timezone (`users.timezone`, default `Asia/Ho_Chi_Minh`)
- Fasting solar dates for horizon **N = 60 days** (same as TECH_DESIGN)
- Enabled reminder slots (`offsetDays`, `localTime`)

For each fasting solar date `F` and each enabled slot `S`:

```
fireLocalDate = F + S.offsetDays
fireLocalDateTime = fireLocalDate + S.localTime   // in user TZ
scheduled_at = toInstant(fireLocalDateTime)
```

Rules:

- Skip if `scheduled_at` is in the past (with 2-minute grace).
- Dedupe key: `{userId}:{F}:{slotKey}` — one row/local-notif id per key.
- On **any** change to fasting rules, timezone, or reminder prefs:
  - Cancel all PENDING (or local scheduled) notifs for that user in horizon.
  - Recompute and recreate.

Horizon refresh: nightly job (Phase C) or app foreground (Phase B) rolls the window forward.

---

## 7. Technical specification

### 7.1 Phase A — Custom lunar days (no delivery yet)

**Backend:** no schema change.

**Mobile**

- Add 4th radio `CUSTOM`.
- Lunar day multi-select sheet (1–30).
- Call existing `updateFastingProfile('CUSTOM', days)`.
- i18n keys EN + VI for labels, sheet, summary, confirm dialog.

**Web**

- Same UX on `/app/reminders`.
- Extend API client to send `customLunarDays`.

**Acceptance**

- [ ] Select Custom → days → Today/Month `isFasting` matches selection.
- [ ] Reload app → selection persists.
- [ ] Switch to fixed preset → rules replace Custom.
- [ ] Empty selection cannot save.
- [ ] EN\|VI copy complete.

### 7.2 Phase B — Local notifications (mobile)

**Prerequisite:** Development build (`expo-dev-client`); not Expo Go alone for reliable iOS permission/push primitives. Local scheduling still uses `expo-notifications`.

**Packages:** `expo-notifications`, `expo-constants` (and `expo-dev-client`).

**App config:** `expo-notifications` plugin; iOS `UIBackgroundModes` / usage as required by Expo docs.

**Client responsibilities**

1. On login / profile load / reminder save / custom days save → `resyncLocalNotifications()`.
2. Fetch: fasting profile + upcoming fasting dates (`GET /calendar/upcoming?days=60` or compute from month endpoints).
3. Cancel previous Sen-scheduled local ids (namespace prefix `sen:`).
4. Schedule future local notifications with matching titles/bodies/data.
5. Request permissions before first schedule attempt.
6. Persist last sync timestamp for debugging.

**Limits:** iOS caps pending local notifications (~64). Strategy:

- Prefer nearer dates first.
- Cap scheduled instances (e.g. max 60 = 20 fasting days × 3 slots, or trim FOLLOWUP if over cap).
- Document in code; Phase C removes this ceiling.

**Acceptance**

- [ ] Enable EVE_BEFORE @ 20:00 → notif fires evening before next fasting day (device clock / TZ correct).
- [ ] Change Custom days → old notifs cancelled; new ones appear.
- [ ] Disable slot → that slot’s notifs removed.
- [ ] Denied permission → REM-05 banner; no crash.
- [ ] Works on physical device with **development build**.

### 7.3 Phase C — Remote push (authoritative)

Aligns with TECH_DESIGN; implement when Phase B is stable.

#### Data

```sql
device_tokens (
  id UUID PK,
  user_id UUID FK,
  platform TEXT,              -- IOS | ANDROID
  expo_push_token TEXT,       -- or raw APNs/FCM later
  notifications_enabled BOOLEAN,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id, expo_push_token)
)

notification_log (
  id UUID PK,
  user_id UUID FK,
  fasting_date DATE,
  slot_key TEXT,
  dedupe_key TEXT UNIQUE,     -- userId:fastingDate:slotKey
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NULL,
  status TEXT,                -- PENDING | SENT | FAILED | CANCELLED
  error TEXT NULL
)
```

#### API

| Method | Path | Body / notes |
|--------|------|----------------|
| `PUT` | `/devices/push-token` | `{ platform, token, notificationsEnabled }` |
| `PATCH` | `/devices/notification-status` | `{ notificationsEnabled }` |
| existing | `PUT /fasting/profile` | After write → trigger reschedule |
| existing | `PUT /fasting/reminders` | After write → trigger reschedule |

#### Worker

1. Planner: upsert PENDING rows for next 60 days.
2. Sender: poll / Redis ZSET by `scheduled_at` → Expo Push API (MVP) or APNs/FCM direct.
3. Cancel PENDING when rules change and date no longer fasting.
4. Idempotent on `dedupe_key`.

**Acceptance**

- [ ] Token registered after permission grant.
- [ ] Test push via Expo tool reaches device.
- [ ] Planner creates rows for Custom + preset users.
- [ ] Profile change cancels obsolete PENDING.
- [ ] Locale flips body language after `PATCH /me` locale (or client sync locale).

---

## 8. API contracts (unchanged + used correctly)

### Update profile (Custom)

```http
PUT /api/v1/fasting/profile
Authorization: Bearer …

{
  "preset": "CUSTOM",
  "customLunarDays": [1, 15, 23]
}
```

### Update reminders

```http
PUT /api/v1/fasting/reminders

{
  "reminders": [
    { "slotKey": "EVE_BEFORE", "enabled": true, "offsetDays": -1, "localTime": "20:00" },
    { "slotKey": "MORNING", "enabled": true, "offsetDays": 0, "localTime": "07:00" },
    { "slotKey": "FOLLOWUP", "enabled": false, "offsetDays": 0, "localTime": "12:00" }
  ]
}
```

Clients **must** keep sending correct `offsetDays` for each slot (do not invent offsets in MVP).

---

## 9. i18n checklist (new strings)

| Key area | EN | VI |
|----------|----|----|
| Preset custom | Custom lunar days… | Tự chọn ngày âm… |
| Sheet title | Choose lunar days | Chọn ngày âm |
| Selected summary | Selected: {days} | Đã chọn: {days} |
| Summary under radios | Custom: {days} | Đang theo: {days} |
| Confirm leave custom | Switch preset and discard custom days? | Đổi lịch có sẵn và bỏ ngày tự chọn? |
| REM-05 banner | Notifications are off… | Thông báo đang tắt… |
| Push bodies | See §5.4 | See §5.4 |

Add to both `apps/web` and `apps/mobile` message catalogs.

---

## 10. Rollout plan

| Phase | Scope | Effort (rough) | Depends on |
|-------|-------|----------------|------------|
| **A** | Custom days UI web + mobile | S | None (API ready) |
| **B** | Local notifs + permission + REM-05 | M | Apple Dev + EAS/dev build for iOS device |
| **C** | Devices + `notification_log` + worker + Expo Push | L | Redis optional; Neon/Railway as today |

Suggested ship order for “simple / cheap / fast”: **A then B**. Treat **C** as production hardening before App Store scale.

---

## 11. Risks & decisions

| Topic | Decision |
|-------|----------|
| Expo Go | Insufficient for Phase B/C on iOS; use development build |
| 64 local notif limit | Phase B truncates horizon; Phase C removes issue |
| FOLLOWUP | Keep optional slot; no check-in dependency in MVP |
| Timezone | Use `users.timezone`; Settings may expose editor later; until then default VN and ensure register sets TZ |
| Dual schedule B+C | When C ships, mobile prefers server push; local used as offline fallback **or** disabled when token registered (prefer **disable local when remote active** to avoid doubles) |
| Web custom days | Required parity with mobile for prefs |

**Open question for product owner:** After Phase C, should local notifications stay as offline fallback or be fully replaced? **Default in this spec: replace when push token active** to avoid duplicate alerts.

---

## 12. Success metrics (lightweight)

- % users on `CUSTOM` vs presets after 2 weeks.
- % users with ≥1 enabled reminder and permission granted.
- Notification open rate (Phase C analytics later).
- Support tickets: “wrong fasting day” / “no reminder” (should drop after A+B).

---

## 13. Implementation checklist (engineering)

### Phase A
- [ ] Mobile: Custom radio + day chip sheet + API
- [ ] Web: same + `customLunarDays` in client
- [ ] i18n EN/VI
- [ ] Manual QA calendar vs rules

### Phase B
- [ ] `eas.json` development profile + `expo-dev-client`
- [ ] `expo-notifications` wiring + resync helper
- [ ] Permission + REM-05
- [ ] Cap / horizon strategy documented in code
- [ ] Device QA against Custom + presets

### Phase C
- [ ] Flyway: `device_tokens`, `notification_log`
- [ ] Devices endpoints + planner + sender
- [ ] Hook profile/reminder PUT → reschedule
- [ ] Mobile token registration
- [ ] Disable local when remote active
- [ ] Staging push test matrix (iOS)

---

## 14. Summary

**Backend already supports custom lunar days.** The main product gaps are **UI for Custom** and **actual delivery** of reminders.

Ship in three phases: **Custom UI → local notifications on a development build → server push**. That matches existing wireframes, avoids waiting on a full worker for first user value, and stays compatible with Sen’s TECH_DESIGN long term.
