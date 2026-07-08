package com.chaynhac.calendar

/**
 * Vietnamese lunisolar calendar (Ho Ngọc Đức algorithm, timezone UTC+7).
 *
 * Reference: https://informatik.uni-leipzig.de/~duc/amlich/
 *
 * Pure domain logic — no Spring/Android deps. Covered by golden vectors in CI.
 */
object VietnameseLunarCalendar {
    /** Vietnam civil time offset used by the Ho Ngọc Đức algorithm. */
    const val TIME_ZONE_HOURS: Double = 7.0

    /** Lunar date components for a given solar day. */
    data class LunarDate(
        val day: Int,
        val month: Int,
        val year: Int,
        val leapMonth: Boolean,
    )

    /**
     * Converts a Gregorian date to Vietnamese lunar calendar.
     *
     * @param timeZone hours east of UTC (default UTC+7 for Vietnam)
     */
    fun fromSolar(year: Int, month: Int, day: Int, timeZone: Double = TIME_ZONE_HOURS): LunarDate {
        val dayNumber = jdFromDate(day, month, year)
        var k = ((dayNumber - 2415021.076998695) / 29.530588853).toInt()
        var monthStart = getNewMoonDay(k + 1, timeZone)
        if (monthStart > dayNumber) {
            monthStart = getNewMoonDay(k, timeZone)
        }
        var a11 = getLunarMonth11(year, timeZone)
        var b11 = a11
        val lunarYear: Int
        if (a11 >= monthStart) {
            lunarYear = year
            a11 = getLunarMonth11(year - 1, timeZone)
        } else {
            lunarYear = year + 1
            b11 = getLunarMonth11(year + 1, timeZone)
        }
        val lunarDay = dayNumber - monthStart + 1
        val diff = ((monthStart - a11) / 29).toInt()
        var lunarLeap = 0
        var lunarMonth = diff + 11
        if (b11 - a11 > 365) {
            val leapMonthDiff = getLeapMonthOffset(a11, timeZone)
            if (diff >= leapMonthDiff) {
                lunarMonth = diff + 10
                if (diff == leapMonthDiff) {
                    lunarLeap = 1
                }
            }
        }
        if (lunarMonth > 12) {
            lunarMonth -= 12
        }
        var adjustedYear = lunarYear
        if (lunarMonth >= 11 && diff < 4) {
            adjustedYear -= 1
        }
        return LunarDate(
            day = lunarDay,
            month = lunarMonth,
            year = adjustedYear,
            leapMonth = lunarLeap == 1,
        )
    }

    /** True if lunar day matches a fasting rule (e.g. day 1 and/or day 15), including leap months. */
    fun isFastingDay(lunar: LunarDate, lunarDays: Set<Int>): Boolean =
        lunar.day in lunarDays

    /** Convenience wrapper: solar date → lunar → fasting check. */
    fun isFastingSolar(
        year: Int,
        month: Int,
        day: Int,
        lunarDays: Set<Int> = setOf(1, 15),
        timeZone: Double = TIME_ZONE_HOURS,
    ): Boolean = isFastingDay(fromSolar(year, month, day, timeZone), lunarDays)

    private fun jdFromDate(dd: Int, mm: Int, yy: Int): Int {
        val a = (14 - mm) / 12
        val y = yy + 4800 - a
        val m = mm + 12 * a - 3
        var jd = dd + (153 * m + 2) / 5 + 365 * y + y / 4 - y / 100 + y / 400 - 32045
        if (jd < 2299161) {
            jd = dd + (153 * m + 2) / 5 + 365 * y + y / 4 - 32083
        }
        return jd
    }

    private fun newMoon(k: Double): Double {
        val t = k / 1236.85
        val t2 = t * t
        val t3 = t2 * t
        val dr = Math.PI / 180
        var jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3
        jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr)
        val m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3
        val mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3
        val f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3
        val c1 =
            (0.1734 - 0.000393 * t) * Math.sin(m * dr) +
                0.0021 * Math.sin(2 * dr * m) -
                0.4068 * Math.sin(mpr * dr) +
                0.0161 * Math.sin(dr * 2 * mpr) -
                0.0004 * Math.sin(dr * 3 * mpr) +
                0.0104 * Math.sin(dr * 2 * f) -
                0.0051 * Math.sin(dr * (m + mpr)) -
                0.0074 * Math.sin(dr * (m - mpr)) +
                0.0004 * Math.sin(dr * (2 * f + m)) -
                0.0004 * Math.sin(dr * (2 * f - m)) -
                0.0006 * Math.sin(dr * (2 * f + mpr)) +
                0.0010 * Math.sin(dr * (2 * f - mpr)) +
                0.0005 * Math.sin(dr * (2 * mpr + m))
        val deltat =
            if (t < -11) {
                0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
            } else {
                -0.000278 + 0.000265 * t + 0.000262 * t2
            }
        return jd1 + c1 - deltat
    }

    private fun sunLongitude(jdn: Double): Double {
        val t = (jdn - 2451545.0) / 36525
        val t2 = t * t
        val dr = Math.PI / 180
        val m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2
        val l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2
        var dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m)
        dl += (0.019993 - 0.000101 * t) * Math.sin(dr * 2 * m) + 0.000290 * Math.sin(dr * 3 * m)
        var l = (l0 + dl) * dr
        l -= Math.PI * 2 * Math.floor(l / (Math.PI * 2))
        return l
    }

    private fun getSunLongitude(dayNumber: Int, timeZone: Double): Int =
        (sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI * 6).toInt()

    private fun getNewMoonDay(k: Int, timeZone: Double): Int =
        (newMoon(k.toDouble()) + 0.5 + timeZone / 24).toInt()

    private fun getLunarMonth11(yy: Int, timeZone: Double): Int {
        val off = jdFromDate(31, 12, yy) - 2415021
        val k = (off / 29.530588853).toInt()
        var nm = getNewMoonDay(k, timeZone)
        if (getSunLongitude(nm, timeZone) >= 9) {
            nm = getNewMoonDay(k - 1, timeZone)
        }
        return nm
    }

    private fun getLeapMonthOffset(a11: Int, timeZone: Double): Int {
        val k = (0.5 + (a11 - 2415021.076998695) / 29.530588853).toInt()
        var i = 1
        var arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
        while (true) {
            val last = arc
            i += 1
            arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone)
            if (arc == last || i >= 14) break
        }
        return i - 1
    }
}
