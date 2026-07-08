# Calendar golden vectors — Sen

## Purpose

Regression dataset for Vietnamese lunar ↔ solar conversion (PRD **CAL-07**).
Failing these tests is a **release blocker**.

## Files

| File | Role |
|------|------|
| [golden-vectors.json](./golden-vectors.json) | Canonical expected dates |
| [generate_vectors.py](./generate_vectors.py) | Regenerates JSON via Hồ Ngọc Đức algorithm (UTC+7) |
| `services/api/.../VietnameseLunarCalendar.kt` | Production Kotlin port |
| `services/api/.../LunarCalendarGoldenTest.kt` | JUnit suite loading the JSON |

## Contents

1. **spotChecks** — Tết 2022–2026, VN/China divergence years (2007, 2030), leap-month starts, sample mid-year day
2. **fastingDaysMung1And15** — every mùng 1 & rằm from `2024-01-01` … `2026-12-31` (includes 2025 nhuận tháng 6)
3. **leapMonthSequences** — every day inside leap months 2023 (tháng 2) and 2025 (tháng 6)

## Regenerate

```bash
python3 docs/calendar/generate_vectors.py
```

Copies to both `docs/calendar/` and `services/api/src/test/resources/calendar/`.

## Verify (no JDK required)

```bash
python3 docs/calendar/verify_vectors.py
```

## Run JVM golden tests

```bash
cd services/api && ./gradlew test --tests 'com.chaynhac.calendar.LunarCalendarGoldenTest'
```

Requires JDK 17+ and Gradle wrapper. The Kotlin port in `VietnameseLunarCalendar.kt` must stay algorithmically identical to `generate_vectors.py`.

## Algorithm note

Vietnam computes new moons at **UTC+7**; China at UTC+8. Do not substitute a China-only library unless every golden vector matches.
