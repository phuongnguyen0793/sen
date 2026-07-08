#!/usr/bin/env python3
"""Validate golden-vectors.json is self-consistent with Hồ Ngọc Đức algorithm.

Runnable without JDK/Gradle:
  python3 docs/calendar/verify_vectors.py
"""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path

# Reuse generator helpers
sys.path.insert(0, str(Path(__file__).resolve().parent))
from generate_vectors import convert_solar_2_lunar  # noqa: E402

VECTORS = Path(__file__).resolve().parent / "golden-vectors.json"


def parse_solar(s: str) -> tuple[int, int, int]:
    y, m, d = map(int, s.split("-"))
    return y, m, d


def main() -> int:
    doc = json.loads(VECTORS.read_text(encoding="utf-8"))
    failures: list[str] = []

    for check in doc["spotChecks"]:
        y, m, d = parse_solar(check["solar"])
        actual = convert_solar_2_lunar(d, m, y)
        exp = check["expected"]
        if actual != exp:
            failures.append(f"spot {check['solar']}: {actual} != {exp}")

    for entry in doc["fastingDaysMung1And15"]["days"]:
        y, m, d = parse_solar(entry["solar"])
        actual = convert_solar_2_lunar(d, m, y)
        if actual != entry["lunar"]:
            failures.append(f"fasting {entry['solar']}: {actual} != {entry['lunar']}")
        if actual["day"] not in (1, 15):
            failures.append(f"fasting {entry['solar']}: day {actual['day']} not in {{1,15}}")

    # Completeness of fasting series
    start = date.fromisoformat(doc["fastingDaysMung1And15"]["from"])
    end = date.fromisoformat(doc["fastingDaysMung1And15"]["to"])
    expected = {e["solar"] for e in doc["fastingDaysMung1And15"]["days"]}
    computed: set[str] = set()
    cur = start
    while cur <= end:
        lun = convert_solar_2_lunar(cur.day, cur.month, cur.year)
        if lun["day"] in (1, 15):
            computed.add(cur.isoformat())
        cur += timedelta(days=1)
    if expected != computed:
        failures.append(
            f"fasting series incomplete: missing={sorted(computed - expected)[:5]} "
            f"extra={sorted(expected - computed)[:5]}"
        )

    for entry in doc["leapMonthSequences"]["days"]:
        y, m, d = parse_solar(entry["solar"])
        actual = convert_solar_2_lunar(d, m, y)
        if actual != entry["lunar"]:
            failures.append(f"leap {entry['solar']}: {actual} != {entry['lunar']}")
        if not actual["leapMonth"]:
            failures.append(f"leap {entry['solar']}: leapMonth=false")

    if failures:
        print(f"FAILED ({len(failures)}):")
        for f in failures[:20]:
            print(" -", f)
        if len(failures) > 20:
            print(f" ... and {len(failures) - 20} more")
        return 1

    print(
        "OK —",
        f"spotChecks={len(doc['spotChecks'])}",
        f"fasting={len(doc['fastingDaysMung1And15']['days'])}",
        f"leapDays={len(doc['leapMonthSequences']['days'])}",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
