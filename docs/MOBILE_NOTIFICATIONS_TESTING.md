# Guide — Test reminders on your iPhone (no paid Apple Developer account)

**Audience:** Local development on a physical iPhone  
**Related product/tech spec:** [NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md](./NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md)  
**Related runbook:** [RUNNING.md](./RUNNING.md)

---

## Do you need another notification “spec”?

**No.** Delivery behavior (web vs mobile, local vs remote push, phases A→B→C) is already defined in [NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md](./NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md).

| Doc | Role |
|-----|------|
| `NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md` | **What** to build — slots, schedule math, Phase B local / Phase C remote, web non-goals |
| **This guide** | **How** to try notifications on **your** phone without paying for Apple Developer |

Use this guide for day-to-day testing. Change product rules only in the main notifications spec.

---

## Mental model (web vs phone)

| Surface | Reminder prefs | How the user is “notified” |
|---------|----------------|----------------------------|
| **Web** | Save times / presets (synced to account) | **No** OS push / no email reminders in MVP |
| **Mobile** | Same prefs | **Local** then **remote** notifications (Phase B → C) |

Email is for **auth** (register/login), not for fasting reminders.

After saving on web, UX should point people to the phone app (see notifications spec §5).

---

## Goal of this guide

Test **local notifications** on **your iPhone only**, using **Expo Go**, **without**:

- Apple Developer Program ($99/year)
- TestFlight
- App Store build

---

## Current code status

As of this writing:

- Reminder **preferences** are saved via API (`PUT /fasting/reminders`).
- **`expo-notifications` is not wired yet** in `apps/mobile` — nothing fires on the device until Phase B is implemented.

You can still follow the **run + Expo Go** steps below to verify the app talks to your API. When Phase B lands, use the **smoke test** section to verify a notification.

---

## Prerequisites

| Item | Notes |
|------|--------|
| Mac (or machine running API) | Docker + JDK 21 for local API |
| iPhone + Apple ID (free) | Same Wi‑Fi as the Mac |
| **Expo Go** from the App Store | Already signed by Expo — no paid Developer account |
| Node 20+ | For `apps/mobile` |

You do **not** need:

- Paid Apple Developer membership  
- Your own APNs key (for Expo Go local tests)  
- EAS production credentials  

---

## Step 1 — Run API + DB on your Mac

```bash
# repo root
docker compose up -d
cd services/api && ./gradlew bootRun
```

Health: http://localhost:8080/actuator/health  

Create/login test user if needed (see [RUNNING.md](./RUNNING.md) — e.g. `mobile@test.com` / `password123`).

---

## Step 2 — Point mobile at your Mac’s LAN IP

On the Mac:

```bash
ipconfig getifaddr en0
```

In `apps/mobile/.env` (from `.env.example`):

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:8080/api/v1
```

**Do not use `localhost` on a physical phone** — that is the phone itself, not your Mac.

---

## Step 3 — Start Expo and open in Expo Go

```bash
cd apps/mobile
npm install
npm start
```

On the iPhone: open **Expo Go** (or Camera) and scan the QR code.  
Same Wi‑Fi; if the packager cannot connect, try the tunnel option in the Expo CLI (`s` then tunnel, or `npx expo start --tunnel`).

Confirm you can sign in and open **Settings → reminders**.

---

## Step 4 — When Phase B exists: local notification smoke test

After `expo-notifications` is implemented (Phase B), use this checklist on the same Expo Go install:

1. Sign in on the phone.  
2. Enable at least one reminder slot (e.g. `MORNING`).  
3. Grant **notification permission** when prompted.  
4. Prefer a **short test path** during development (e.g. schedule a one-off local notif **~1 minute** ahead, or temporarily point at a near fasting day).  
5. Lock the phone / leave the app — confirm the banner/sound appears.  
6. Change reminder time or disable the slot — confirm old schedules are cancelled (per notifications spec).

### Expo Go vs development build

| Path | Paid Apple Developer? | Good for |
|------|------------------------|----------|
| **Expo Go** | No | Personal device, iterating Phase B local notifs |
| **Dev client / EAS** | Free Personal Team possible (7‑day cert) or paid | Closer to production; more reliable long-term iOS behavior |
| **TestFlight / App Store / own APNs** | **Yes ($99)** | Distribution & Phase C remote push at scale |

The product spec prefers a **dev build** for “reliable” iOS permission/push primitives long term. For **only your phone**, start with **Expo Go**; move to a dev build when Expo Go limits block you.

---

## What you still cannot do without paid Developer (usually)

- Publish to **TestFlight** / App Store under **your** bundle id for other testers  
- Production **APNs** credentials tied to your team for Phase C at scale  
- A permanent App Store–style install that never expires (Personal Team builds expire ~7 days)

Remote push **via Expo’s push service** may be testable later with Expo tooling; treat Phase C as separate from this “no $99 / Expo Go” path.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| App cannot reach API | LAN IP in `.env`; phone & Mac on same Wi‑Fi; Mac firewall allows 8080 |
| Expo QR fails | Same Wi‑Fi, or `npx expo start --tunnel` |
| No notification (after Phase B) | Check OS Settings → Sen/Expo Go → Notifications allowed; confirm schedule used device timezone |
| “It works on web but phone silent” | Expected until Phase B — web does not deliver OS notifications |

---

## Implementation pointer

When building Phase B, follow [NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md](./NOTIFICATIONS_AND_CUSTOM_DAYS_SPEC.md) §7.2 (`expo-notifications`, permission UX, resync on save). Keep this file as the **tester runbook**; keep schedule math and web non-goals in the main spec only.
