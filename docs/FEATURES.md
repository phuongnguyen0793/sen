# Feature tracker — Sen

Living checklist of product functionality across **backend**, **web**, and **mobile**.  
Aligns with [WIREFRAMES.md](./WIREFRAMES.md), [TECH_DESIGN.md](./TECH_DESIGN.md), and [PRODUCT_ASSUMPTIONS.md](./PRODUCT_ASSUMPTIONS.md).

**Status legend**

| Mark | Meaning |
|------|---------|
| ✅ | Shipped / usable |
| 🟡 | Partial (API or UI incomplete) |
| ❌ | Not started |
| — | N/A for this surface |

Update this file when a feature lands or scope changes.

---

## Auth & session

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Register (email/password) | ✅ | ✅ | ✅ | |
| Login (email/password) | ✅ | ✅ | ✅ | |
| Refresh token rotation | ✅ | 🟡 | 🟡 | Client helpers exist; not auto-used on 401 yet |
| Logout (revoke refresh) | ✅ | ✅ | ✅ | Both clients call `/auth/logout` |
| OAuth Apple / Google | 🟡 | ❌ | ❌ | API returns **501** placeholder |
| Auth-aware landing CTAs | — | ✅ | — | Logged-in: no Sign in; Open app + Sign out |
| Redirect `/login` if already signed in | — | ✅ | — | |
| App header Sign out | — | ✅ | — | |
| Secure token storage | — | 🟡 | ✅ | Web: `localStorage`; Mobile: SecureStore |
| httpOnly BFF cookie session | ❌ | ❌ | — | TECH_DESIGN §11 optional |

---

## User profile

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| GET `/me` | ✅ | 🟡 | 🟡 | Client helpers exist / unused in UI |
| PATCH `/me` (name, timezone, locale, prefs) | ✅ | ❌ | ❌ | |
| DELETE `/me` (soft delete) | ✅ | ❌ | ❌ | |
| Sync `user.locale` from EN\|VI picker | ❌ | ❌ | ❌ | Planned TECH_DESIGN §14.12 |
| Prefer no onion/garlic flag | ✅ | ❌ | ❌ | On user / fasting profile |

---

## Onboarding (≤ 4 steps)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Welcome / purpose | — | ❌ | ❌ | Mobile-primary per wireframes |
| Choose fasting schedule (CAL-03) | ✅ | ✅ | ✅ | Presets editable on web + mobile Settings |
| Custom lunar days | ✅ | ❌ | ❌ | Preset `CUSTOM` / rules API |
| Reminder times (REM-01) | ✅ | ✅ | ✅ | Editable enable + HH:mm; `PUT /fasting/reminders` |
| Account + notification permission | 🟡 | — | ❌ | Push/devices API not built |

Web thin parity uses login/register instead of full onboarding.

---

## Home / Today (UX-01)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Today status (solar + lunar + fasting) | ✅ | ✅ | ✅ | `GET /calendar/today` |
| Not-fasting empty copy | — | 🟡 | 🟡 | Basic string; richer copy pending |
| Upcoming / next fasting day | ✅ | ❌ | ❌ | `GET /calendar/upcoming` unused by clients |
| Greeting + display name | ✅ | ❌ | ❌ | Needs `/me` |
| Check-in (ate / missed) | ❌ | ❌ | ❌ | No check-in API yet |
| Streak | ❌ | ❌ | ❌ | No stats API yet |
| Recipe suggestion strip | ❌ | ❌ | ❌ | Recipes not built |
| AI suggest CTA + quota | ❌ | ❌ | ❌ | |
| Notification-disabled banner (REM-05) | ❌ | — | ❌ | Push/devices N/A on web |

---

## Calendar / Lịch (CAL-*)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Month payload (solar + lunar + fasting flags) | ✅ | ✅ | ✅ | Month grid + fasting list |
| Month **grid** UI (dual day cells) | — | ✅ | ✅ | Solar + lunar; fasting + today markers |
| Month ⟨ ⟩ navigation | — | ✅ | ✅ | Month chips + year (1900–2100) + This month |
| Upcoming list (30 days) | ✅ | ❌ | ❌ | |
| Day detail sheet (check-in, recipes link) | ❌ | ❌ | ❌ | Check-in/recipes blocked |
| Sync-failed soft banner | — | ❌ | ❌ | |

---

## Reminders & fasting schedule

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| GET fasting profile | ✅ | ✅ | ✅ | |
| PUT fasting preset | ✅ | ✅ | ✅ | |
| PUT custom rules / lunar days | ✅ | ❌ | ❌ | |
| PUT reminder slots (enable + time) | ✅ | ✅ | ✅ | Editable + save on web + mobile |
| Web `/app/reminders` | — | ✅ | — | Presets + editable times |
| OS notification status UI | ❌ | — | ❌ | |
| Timezone display | ✅ | ❌ | ❌ | On `/me` |
| Nested under Settings (mobile) | — | — | ✅ | Settings: presets + reminder editor + sign out |

---

## Recipes / Món (REC-*)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Curated list + filters | ❌ | ❌ | ❌ | Route `/app/recipes` missing |
| Recipe detail | ❌ | ❌ | ❌ | |
| Bookmark / favorites | ❌ | ❌ | ❌ | |
| AI generate + daily quota | ❌ | ❌ | ❌ | Deferred on web per wireframes |
| Culinary disclaimer | — | ❌ | ❌ | |

---

## Marketing & content (web)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Landing `/` hero + CTAs | — | ✅ | — | Auth-aware CTAs |
| Blog `/blog` placeholder | — | ❌ | — | |
| App Store / download CTA | — | ❌ | — | Optional |

---

## Internationalization (i18n)

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| EN \| VI message catalogs | — | ✅ | ✅ | |
| Language switcher UI | — | ✅ | ✅ | |
| Persist locale (`sen.locale`) | — | ✅ | ✅ | |
| Localized push notification bodies | ❌ | — | ❌ | |
| Shared `packages/i18n` | — | ❌ | ❌ | Planned when recipes land |

---

## Notifications & devices

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Device token registration | ❌ | — | ❌ | |
| Reminder planner / worker | ❌ | — | — | |
| APNs / FCM delivery | ❌ | — | ❌ | |

---

## Platform shells & infra

| Feature | Backend | Web | Mobile | Notes |
|---------|---------|-----|--------|-------|
| Health / actuator | ✅ | — | — | |
| OpenAPI contract | 🟡 | — | — | Stub summaries in `openapi.yaml` |
| API proxy BFF (`/api/proxy`) | — | ✅ | — | |
| Docker Compose (DB / full stack) | ✅ | ✅ | — | |
| Lunar calendar + golden vectors | ✅ | — | — | |
| Tab nav: Home · Lịch · Món · Cài đặt | — | — | 🟡 | Today + Calendar + Settings (Món deferred) |
| Web top nav (Today / Calendar / Reminders) | — | ✅ | — | No Recipes yet |

---

## Suggested build order (clients + API gaps)

1. **Wire existing calendar APIs on web** — upcoming on Home; month grid + upcoming on Calendar.  
2. **Editable reminders on web** — `PUT /fasting/reminders` + custom days / no-onion.  
3. **Mobile parity** — Calendar tab, register, editable fasting/reminders, logout revoke.  
4. **Backend: check-ins + streak** — then Home check-in UI on both clients.  
5. **Backend: recipes** — then `/app/recipes` + mobile Món tab (AI optional later).  
6. **Notifications stack** — devices + planner (mobile).  
7. **OAuth + account deletion UI** — when needed for store / privacy.

---

## How to update

When you ship something:

1. Flip ❌ → 🟡 or ✅ in the right column(s).  
2. Add a short note (PR / date optional).  
3. If a new epic appears in wireframes/tech design, add a row here first.
