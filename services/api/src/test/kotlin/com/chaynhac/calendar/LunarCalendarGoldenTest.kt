package com.chaynhac.calendar

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.DynamicTest
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestFactory
import java.time.LocalDate

/**
 * Golden regression suite — PRD CAL-07 / NFR zero critical lunar bugs.
 * Vectors: classpath:/calendar/golden-vectors.json (synced from docs/calendar/).
 */
class LunarCalendarGoldenTest {
    private val mapper =
        jacksonObjectMapper().apply {
            configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        }
    private val vectors: GoldenVectors by lazy {
        val stream =
            requireNotNull(
                javaClass.getResourceAsStream("/calendar/golden-vectors.json"),
            ) { "Missing golden-vectors.json on classpath" }
        stream.use { mapper.readValue(it) }
    }

    @TestFactory
    fun spotChecks(): Collection<DynamicTest> =
        vectors.spotChecks.map { check ->
            DynamicTest.dynamicTest("${check.solar} — ${check.note}") {
                val solar = LocalDate.parse(check.solar)
                val actual =
                    VietnameseLunarCalendar.fromSolar(
                        solar.year,
                        solar.monthValue,
                        solar.dayOfMonth,
                    )
                assertEquals(check.expected.day, actual.day, "day")
                assertEquals(check.expected.month, actual.month, "month")
                assertEquals(check.expected.year, actual.year, "year")
                assertEquals(check.expected.leapMonth, actual.leapMonth, "leapMonth")
            }
        }

    @TestFactory
    fun fastingDaysMung1And15(): Collection<DynamicTest> {
        val days = vectors.fastingDaysMung1And15.days
        assertTrue(days.size >= 70, "expected multi-year series, got ${days.size}")
        return days.map { entry ->
            DynamicTest.dynamicTest("fasting ${entry.solar}") {
                val solar = LocalDate.parse(entry.solar)
                val actual =
                    VietnameseLunarCalendar.fromSolar(
                        solar.year,
                        solar.monthValue,
                        solar.dayOfMonth,
                    )
                assertEquals(entry.lunar.day, actual.day)
                assertEquals(entry.lunar.month, actual.month)
                assertEquals(entry.lunar.year, actual.year)
                assertEquals(entry.lunar.leapMonth, actual.leapMonth)
                assertTrue(
                    VietnameseLunarCalendar.isFastingDay(actual, setOf(1, 15)),
                    "expected fasting day for $actual",
                )
            }
        }
    }

    @TestFactory
    fun leapMonthSequences(): Collection<DynamicTest> =
        vectors.leapMonthSequences.days.map { entry ->
            DynamicTest.dynamicTest("leap ${entry.solar}") {
                val solar = LocalDate.parse(entry.solar)
                val actual =
                    VietnameseLunarCalendar.fromSolar(
                        solar.year,
                        solar.monthValue,
                        solar.dayOfMonth,
                    )
                assertEquals(entry.lunar.day, actual.day)
                assertEquals(entry.lunar.month, actual.month)
                assertEquals(entry.lunar.year, actual.year)
                assertTrue(actual.leapMonth, "expected leapMonth=true for ${entry.solar}")
            }
        }

    @Test
    fun fastingSeriesIsCompleteForRange() {
        val from = LocalDate.parse(vectors.fastingDaysMung1And15.from)
        val to = LocalDate.parse(vectors.fastingDaysMung1And15.to)
        val expected = vectors.fastingDaysMung1And15.days.map { it.solar }.toSet()
        val computed = linkedSetOf<String>()
        var cursor = from
        while (!cursor.isAfter(to)) {
            if (
                VietnameseLunarCalendar.isFastingSolar(
                    cursor.year,
                    cursor.monthValue,
                    cursor.dayOfMonth,
                )
            ) {
                computed += cursor.toString()
            }
            cursor = cursor.plusDays(1)
        }
        assertEquals(expected, computed, "Mùng 1 + 15 series mismatch vs golden file")
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    /** Root structure of `golden-vectors.json`. */
    data class GoldenVectors(
        val meta: Map<String, Any?>? = null,
        val spotChecks: List<SpotCheck>,
        val fastingDaysMung1And15: FastingSeries,
        val leapMonthSequences: LeapSeries,
    )

    data class SpotCheck(
        val solar: String,
        val expected: LunarParts,
        val note: String? = null,
    )

    data class FastingSeries(
        val from: String,
        val to: String,
        val days: List<FastingDay>,
    )

    data class FastingDay(
        val solar: String,
        val lunar: LunarParts,
    )

    data class LeapSeries(
        val days: List<LeapDay>,
    )

    data class LeapDay(
        val solar: String,
        val lunar: LunarParts,
    )

    data class LunarParts(
        val day: Int,
        val month: Int,
        val year: Int,
        val leapMonth: Boolean,
    )
}
