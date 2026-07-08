package com.chaynhac.calendar

import com.chaynhac.fasting.FastingService
import com.chaynhac.repository.FastingProfileRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId
import java.util.UUID

data class LunarInfoDto(
    val day: Int,
    val month: Int,
    val year: Int,
    val leapMonth: Boolean,
)

data class CalendarDayDto(
    val solarDate: String,
    val lunar: LunarInfoDto,
    val isFasting: Boolean,
    val isToday: Boolean,
)

data class MonthCalendarResponse(
    val year: Int,
    val month: Int,
    val days: List<CalendarDayDto>,
)

data class TodayStatusResponse(
    val solarDate: String,
    val lunar: LunarInfoDto,
    val isFasting: Boolean,
    /** `mung_1`, `ram`, or `custom` when [isFasting] is true. */
    val label: String?,
)

data class UpcomingFastingDayDto(
    val solarDate: String,
    val lunar: LunarInfoDto,
    val daysUntil: Long,
)

data class UpcomingFastingResponse(
    val days: List<UpcomingFastingDayDto>,
)

/**
 * Builds calendar API responses by combining [VietnameseLunarCalendar]
 * with the user's fasting profile rules.
 */
@Service
class CalendarApiService(
    private val fastingProfileRepository: FastingProfileRepository,
    private val fastingService: FastingService,
) {
    @Transactional(readOnly = true)
    fun month(userId: UUID, year: Int, month: Int, zoneId: ZoneId): MonthCalendarResponse {
        val lunarDays = fastingDaysForUser(userId)
        val ym = YearMonth.of(year, month)
        val today = LocalDate.now(zoneId)
        val days =
            (1..ym.lengthOfMonth()).map { day ->
                val solar = ym.atDay(day)
                val lunar = VietnameseLunarCalendar.fromSolar(solar.year, solar.monthValue, solar.dayOfMonth)
                val dto = lunar.toDto()
                CalendarDayDto(
                    solarDate = solar.toString(),
                    lunar = dto,
                    isFasting = VietnameseLunarCalendar.isFastingDay(lunar, lunarDays),
                    isToday = solar == today,
                )
            }
        return MonthCalendarResponse(year = year, month = month, days = days)
    }

    @Transactional(readOnly = true)
    fun today(userId: UUID, zoneId: ZoneId): TodayStatusResponse {
        val solar = LocalDate.now(zoneId)
        val lunar = VietnameseLunarCalendar.fromSolar(solar.year, solar.monthValue, solar.dayOfMonth)
        val lunarDays = fastingDaysForUser(userId)
        val isFasting = VietnameseLunarCalendar.isFastingDay(lunar, lunarDays)
        return TodayStatusResponse(
            solarDate = solar.toString(),
            lunar = lunar.toDto(),
            isFasting = isFasting,
            label =
                when {
                    !isFasting -> null
                    lunar.day == 1 -> "mung_1"
                    lunar.day == 15 -> "ram"
                    else -> "custom"
                },
        )
    }

    @Transactional(readOnly = true)
    fun upcoming(userId: UUID, days: Int, zoneId: ZoneId): UpcomingFastingResponse {
        val lunarDays = fastingDaysForUser(userId)
        val start = LocalDate.now(zoneId)
        val end = start.plusDays(days.toLong())
        val result = mutableListOf<UpcomingFastingDayDto>()
        var cursor = start
        while (!cursor.isAfter(end)) {
            val lunar = VietnameseLunarCalendar.fromSolar(cursor.year, cursor.monthValue, cursor.dayOfMonth)
            if (VietnameseLunarCalendar.isFastingDay(lunar, lunarDays)) {
                result.add(
                    UpcomingFastingDayDto(
                        solarDate = cursor.toString(),
                        lunar = lunar.toDto(),
                        daysUntil = java.time.temporal.ChronoUnit.DAYS.between(start, cursor),
                    ),
                )
            }
            cursor = cursor.plusDays(1)
        }
        return UpcomingFastingResponse(days = result)
    }

    private fun fastingDaysForUser(userId: UUID): Set<Int> {
        val profile = fastingProfileRepository.findByUserIdWithDetails(userId).orElse(null)
            ?: return setOf(1, 15)
        return fastingService.lunarDaysForProfile(profile).ifEmpty { setOf(1, 15) }
    }

    private fun VietnameseLunarCalendar.LunarDate.toDto(): LunarInfoDto =
        LunarInfoDto(day = day, month = month, year = year, leapMonth = leapMonth)
}
