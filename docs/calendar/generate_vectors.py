#!/usr/bin/env python3
"""Regenerate golden-vectors.json using the Ho Ngoc Duc VN lunar algorithm (UTC+7).

Usage (from repo root):
  python3 docs/calendar/generate_vectors.py

Then copy to test resources:
  cp docs/calendar/golden-vectors.json \\
     services/api/src/test/resources/calendar/golden-vectors.json
"""

from __future__ import annotations

import json
import math
from datetime import date, timedelta
from pathlib import Path

PI = math.pi
TZ = 7.0
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent / "golden-vectors.json"
TEST_COPY = (
    ROOT
    / "services"
    / "api"
    / "src"
    / "test"
    / "resources"
    / "calendar"
    / "golden-vectors.json"
)


def jd_from_date(dd: int, mm: int, yy: int) -> int:
    a = (14 - mm) // 12
    y = yy + 4800 - a
    m = mm + 12 * a - 3
    jd = dd + ((153 * m + 2) // 5) + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    if jd < 2299161:
        jd = dd + ((153 * m + 2) // 5) + 365 * y + y // 4 - 32083
    return jd


def new_moon(k: float) -> float:
    t = k / 1236.85
    t2 = t * t
    t3 = t2 * t
    dr = PI / 180
    jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
    jd1 += 0.00033 * math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr)
    m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3
    mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3
    f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3
    c1 = (
        (0.1734 - 0.000393 * t) * math.sin(m * dr)
        + 0.0021 * math.sin(2 * dr * m)
        - 0.4068 * math.sin(mpr * dr)
        + 0.0161 * math.sin(dr * 2 * mpr)
        - 0.0004 * math.sin(dr * 3 * mpr)
        + 0.0104 * math.sin(dr * 2 * f)
        - 0.0051 * math.sin(dr * (m + mpr))
        - 0.0074 * math.sin(dr * (m - mpr))
        + 0.0004 * math.sin(dr * (2 * f + m))
        - 0.0004 * math.sin(dr * (2 * f - m))
        - 0.0006 * math.sin(dr * (2 * f + mpr))
        + 0.0010 * math.sin(dr * (2 * f - mpr))
        + 0.0005 * math.sin(dr * (2 * mpr + m))
    )
    if t < -11:
        deltat = (
            0.001
            + 0.000839 * t
            + 0.0002261 * t2
            - 0.00000845 * t3
            - 0.000000081 * t * t3
        )
    else:
        deltat = -0.000278 + 0.000265 * t + 0.000262 * t2
    return jd1 + c1 - deltat


def sun_longitude(jdn: float) -> float:
    t = (jdn - 2451545.0) / 36525
    t2 = t * t
    dr = PI / 180
    m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2
    l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2
    dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * math.sin(dr * m)
    dl += (0.019993 - 0.000101 * t) * math.sin(dr * 2 * m) + 0.000290 * math.sin(
        dr * 3 * m
    )
    l = (l0 + dl) * dr
    l -= PI * 2 * (l // (PI * 2))
    return l


def get_sun_longitude(day_number: int, time_zone: float) -> int:
    return int(sun_longitude(day_number - 0.5 - time_zone / 24) / PI * 6)


def get_new_moon_day(k: int, time_zone: float) -> int:
    return int(new_moon(k) + 0.5 + time_zone / 24)


def get_lunar_month11(yy: int, time_zone: float) -> int:
    off = jd_from_date(31, 12, yy) - 2415021
    k = int(off / 29.530588853)
    nm = get_new_moon_day(k, time_zone)
    if get_sun_longitude(nm, time_zone) >= 9:
        nm = get_new_moon_day(k - 1, time_zone)
    return nm


def get_leap_month_offset(a11: int, time_zone: float) -> int:
    k = int(0.5 + (a11 - 2415021.076998695) / 29.530588853)
    i = 1
    arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
    while True:
        last = arc
        i += 1
        arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
        if arc == last or i >= 14:
            break
    return i - 1


def convert_solar_2_lunar(dd: int, mm: int, yy: int, time_zone: float = TZ) -> dict:
    day_number = jd_from_date(dd, mm, yy)
    k = int((day_number - 2415021.076998695) / 29.530588853)
    month_start = get_new_moon_day(k + 1, time_zone)
    if month_start > day_number:
        month_start = get_new_moon_day(k, time_zone)
    a11 = get_lunar_month11(yy, time_zone)
    b11 = a11
    if a11 >= month_start:
        lunar_year = yy
        a11 = get_lunar_month11(yy - 1, time_zone)
    else:
        lunar_year = yy + 1
        b11 = get_lunar_month11(yy + 1, time_zone)
    lunar_day = day_number - month_start + 1
    diff = int((month_start - a11) / 29)
    lunar_leap = 0
    lunar_month = diff + 11
    if b11 - a11 > 365:
        leap_month_diff = get_leap_month_offset(a11, time_zone)
        if diff >= leap_month_diff:
            lunar_month = diff + 10
            if diff == leap_month_diff:
                lunar_leap = 1
    if lunar_month > 12:
        lunar_month -= 12
    if lunar_month >= 11 and diff < 4:
        lunar_year -= 1
    return {
        "day": int(lunar_day),
        "month": int(lunar_month),
        "year": int(lunar_year),
        "leapMonth": bool(lunar_leap),
    }


def find_fasting(start: date, end: date, lunar_days=(1, 15)) -> list:
    out = []
    d = start
    while d <= end:
        lun = convert_solar_2_lunar(d.day, d.month, d.year)
        if lun["day"] in lunar_days:
            labels = []
            if lun["day"] == 1:
                labels.append("mung_1")
            if lun["day"] == 15:
                labels.append("ram")
            if lun["leapMonth"]:
                labels.append("leap_month")
            out.append({"solar": d.isoformat(), "lunar": lun, "labels": labels})
        d += timedelta(days=1)
    return out


def main() -> None:
    spot = []
    for s, note in [
        ("2022-02-01", "Tet 2022 Nhâm Dần"),
        ("2023-01-22", "Tet 2023 Quý Mão"),
        ("2024-02-10", "Tet 2024 Giáp Thìn"),
        ("2025-01-29", "Tet 2025 Ất Tỵ"),
        ("2026-02-17", "Tet 2026 Bính Ngọ"),
        ("2007-02-17", "VN Tet 2007 (China was 2007-02-18) — timezone-sensitive"),
        ("2030-02-02", "VN Tet 2030 (China was 2030-02-03)"),
        ("2023-03-22", "Mùng 1 tháng 2 nhuận 2023"),
        ("2025-07-25", "Mùng 1 tháng 6 nhuận 2025"),
        ("2026-07-08", "Sample mid-year for app launch era"),
    ]:
        y, m, d = map(int, s.split("-"))
        spot.append(
            {"solar": s, "expected": convert_solar_2_lunar(d, m, y), "note": note}
        )

    fasting = find_fasting(date(2024, 1, 1), date(2026, 12, 31))

    leap_days = []
    for start, end in [
        (date(2023, 3, 22), date(2023, 4, 19)),
        (date(2025, 7, 25), date(2025, 8, 22)),
    ]:
        d = start
        while d <= end:
            lun = convert_solar_2_lunar(d.day, d.month, d.year)
            if lun["leapMonth"]:
                leap_days.append({"solar": d.isoformat(), "lunar": lun})
            d += timedelta(days=1)

    doc = {
        "meta": {
            "version": "1.0.0",
            "timezone": "Asia/Ho_Chi_Minh",
            "algorithm": "Ho Ngoc Duc Vietnamese lunar (UTC+7)",
            "algorithmReference": "https://informatik.uni-leipzig.de/~duc/amlich/",
            "notes": [
                "Vietnam uses UTC+7 for calendar computation; China uses UTC+8 — diverge in 2007, 2030, 2053 New Year dates.",
                "Implementations MUST match these vectors (not mainland-China-only libraries unless verified identical).",
                "leapMonth=true means the date falls in the intercalary (nhuận) month of that lunar month number.",
                "Generated by docs/calendar/generate_vectors.py — re-run after algorithm changes.",
            ],
        },
        "spotChecks": spot,
        "fastingDaysMung1And15": {
            "description": "All solar dates from 2024-01-01 through 2026-12-31 where lunar day is 1 or 15 (includes leap months).",
            "rule": "MUNG_1_AND_15",
            "from": "2024-01-01",
            "to": "2026-12-31",
            "count": len(fasting),
            "days": fasting,
        },
        "leapMonthSequences": {
            "description": "Every day inside known leap months (for leapMonth flag regression).",
            "days": leap_days,
        },
        "acceptance": {
            "ci": "LunarCalendarGoldenTest must pass 100% of spotChecks and fastingDaysMung1And15 and leapMonthSequences",
            "prdAlignment": "CAL-07, NFR calendar zero critical date bugs, MVP DoD item 2",
        },
    }

    text = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"
    OUT.write_text(text, encoding="utf-8")
    TEST_COPY.parent.mkdir(parents=True, exist_ok=True)
    TEST_COPY.write_text(text, encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"Wrote {TEST_COPY}")
    print(f"spotChecks={len(spot)} fasting={len(fasting)} leapDays={len(leap_days)}")


if __name__ == "__main__":
    main()
