# Product Assumptions — Sen

**Status:** Locked for MVP implementation  
**Date:** 2026-07-08 (brand locked 2026-07-08)  
**Based on:** PRD 1.0 Draft

This document resolves the open questions from the PRD so design and engineering can proceed without ambiguity.

---

## 1. Locked defaults from PRD

| Assumption | Decision |
|------------|----------|
| Market | Vietnam-first (`vi-VN`, timezone `Asia/Ho_Chi_Minh`) |
| Primary persona | Buddhist / Vietnamese cultural lunar fasting (mùng 1, rằm) |
| Secondary persona | Flexitarian / custom lunar or weekday rules — supported in MVP |
| Platforms | React Native (iOS polish priority + Android same codebase), Next.js web, Spring Boot Kotlin |
| Monetization | Free MVP with AI rate limit; Freemium in Phase 2 |
| Social | Out of scope for MVP |
| Niệm filter (no onion/garlic) | Important filter, opt-in per user — not forced |

---

## 2. Resolved open questions

### 2.1 Brand name & tone

| Field | Decision                                                                                                                                              |
|-------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Brand (global)** | **Sen** — lotus; soft Vietnamese cultural cue, pronounceable internationally                                                                          |
| App name `vi-VN` | **Sen** — Nhắc ăn chay âm lịch                                                                                                                        |
| App name `en-US` | **Sen** — Lunar Fasting Companion                                                                                                                     |
| Tagline `vi-VN` | Mùng 1, rằm — không bao giờ quên                                                                                                                      |
| Tagline `en-US` | Never miss lunar fasting days                                                                                                                         |
| Bundle ID (target) | `app.sen.lunar`                                                                                                                                       |
| Deep link scheme | `sen://`                                                                                                                                              |
| Repo / package (internal) | `sen` / `sen`; user-facing brand is always **Sen**                                                                                    |
| Tone | Soft Vietnamese cultural — warm, calm, practical. Respectful of Phật giáo practice without requiring religious identity. Not clinical/health-app tone. |
| Voice examples | “Ngày mai mùng 1 — nhớ ăn chay nhé.” / “Hôm nay rằm. Sen có sẵn vài món gợi ý.”                                                                       |
| Avoid | Proselytizing copy; medical claims; cold productivity jargon                                                                                          |

### 2.2 Guest mode vs early login

| Decision | **Require login early in MVP** (end of onboarding step 1 or before saving reminders) |
|----------|--------------------------------------------------------------------------------------|
| Rationale | Multi-device sync (ACC-05) and push token binding are simpler with an authenticated user. Guest sync/merge is P1. |
| UX | Onboarding can still collect fasting preferences locally for one session; account creation before “Bật nhắc” commits them. |
| Auth | Email+password, Sign in with Apple (iOS), Google (Android/Web) |

### 2.3 Chay trường (year-round) mode

| Decision | **Not a first-class mode in MVP** |
|----------|-----------------------------------|
| Workaround | Users who eat chay daily can use custom rules or simply ignore fasting highlights; no separate “365” product mode until Phase 1+ demand. |
| Phase 1 candidate | Optional “Chay trường” toggle that skips lunar rule requirements but keeps recipes + reminders off by default. |

### 2.4 AI provider & budget

| Field | Decision |
|-------|----------|
| Primary provider | **OpenAI** (chat + structured JSON for recipes) via backend proxy only |
| Fallback | Curated recipe feed when AI fails or quota exhausted |
| Free MVP quota | **2 AI recipe generations / user / day** (REC-05) |
| Soft monthly budget (target) | Cap AI spend alerting at ~$50–100/month early; hard kill-switch via feature flag (ADM-02) |
| PII | Only preference tags (noonion, allergies, cook_time) — never name/email in prompts |

### 2.5 Landing SEO + blog on Next.js

| Decision | **Yes — thin marketing landing from day one** |
|----------|-----------------------------------------------|
| Scope MVP | `/` marketing page (value prop, CTA download / web login); `/app/*` authenticated app (calendar + settings) |
| Blog | Stub only (`/blog` placeholder). Full recipe SEO blog deferred to Phase 1 with CMS recipes |
| Rationale | App Store + organic search need a public URL; recipe blog needs content ops not in MVP critical path |

---

## 3. Product principles (implementation guardrails)

1. **Lunar accuracy is non-negotiable** — Vietnamese lunar calendar with leap months; golden tests gate CI.
2. **Day boundaries use user timezone** — default `Asia/Ho_Chi_Minh`.
3. **Reminders default to 2 slots** — evening before (20:00) + morning of (07:00); quiet hours P1.
4. **AI is assistive** — never the sole source of recipe truth; curated fallback always available.
5. **Privacy-first prompts** — redact PII; Vietnamese privacy policy before App Store submit.

---

## 4. MVP acceptance alignment

These assumptions feed Definition of Done:

- Onboarding ≤ 2 minutes ending in authenticated user + at least one reminder rule.
- Web thin parity: calendar view + reminder preferences (not full recipe AI parity on web in MVP).
- AI failures never block Home / Calendar / Check-in.

---

## 5. Change control

Changes to locked assumptions require an explicit product decision note in `docs/` and update to affected tech design sections. Do not silently diverge in tickets.
