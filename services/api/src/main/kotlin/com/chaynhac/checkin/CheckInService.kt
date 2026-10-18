package com.chaynhac.checkin

import com.chaynhac.calendar.VietnameseLunarCalendar
import com.chaynhac.common.ApiException
import com.chaynhac.domain.CheckInEntity
import com.chaynhac.domain.CheckInStatus
import com.chaynhac.fasting.FastingService
import com.chaynhac.repository.CheckInRepository
import com.chaynhac.repository.FastingProfileRepository
import com.chaynhac.user.UserService
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

data class CheckInResponse(
    val localDate: String,
    val status: CheckInStatus,
    val note: String?,
    val updatedAt: String,
)

data class UpsertCheckInRequest(
    val status: CheckInStatus,
    val note: String? = null,
)

data class StreakResponse(
    val current: Int,
    val best: Int,
)

@Service
class CheckInService(
    private val checkInRepository: CheckInRepository,
    private val fastingProfileRepository: FastingProfileRepository,
    private val fastingService: FastingService,
    private val userService: UserService,
) {
    @Transactional
    fun upsert(userId: UUID, localDate: LocalDate, request: UpsertCheckInRequest): CheckInResponse {
        val user = userService.findActiveUser(userId)
        val today = LocalDate.now(ZoneId.of(user.timezone))
        if (localDate.isAfter(today)) {
            throw ApiException("FUTURE_DATE", "You can only check in today or a past day")
        }
        if (!isFasting(lunarDays(userId), localDate)) {
            throw ApiException("NOT_FASTING_DAY", "That day is not a fasting day")
        }
        val note = request.note?.trim()?.ifBlank { null }
        if (note != null && note.length > 280) {
            throw ApiException("VALIDATION_ERROR", "Note must be 280 characters or fewer")
        }
        val existing = checkInRepository.findByUserIdAndLocalDate(userId, localDate).orElse(null)
        val saved =
            if (existing == null) {
                checkInRepository.save(
                    CheckInEntity(user = user, localDate = localDate, status = request.status, note = note),
                )
            } else {
                existing.status = request.status
                existing.note = note
                existing.updatedAt = Instant.now()
                checkInRepository.save(existing)
            }
        return toResponse(saved)
    }

    @Transactional(readOnly = true)
    fun range(userId: UUID, from: LocalDate, to: LocalDate): List<CheckInResponse> {
        if (to.isBefore(from) || from.plusDays(370).isBefore(to)) {
            throw ApiException("VALIDATION_ERROR", "Date range must be within 370 days", HttpStatus.BAD_REQUEST)
        }
        return checkInRepository.findByUserIdAndLocalDateBetweenOrderByLocalDateAsc(userId, from, to).map(::toResponse)
    }

    /**
     * Current streak is the run of DONE fasting days ending at the latest fasting day
     * that is already decided. Today stays open until it is marked DONE.
     */
    @Transactional(readOnly = true)
    fun streak(userId: UUID): StreakResponse {
        val user = userService.findActiveUser(userId)
        val today = LocalDate.now(ZoneId.of(user.timezone))
        val from = today.minusDays(LOOKBACK_DAYS)
        val days = lunarDays(userId)
        val byDate =
            checkInRepository
                .findByUserIdAndLocalDateBetweenOrderByLocalDateAsc(userId, from, today)
                .associateBy { it.localDate }

        var current = 0
        var cursor = today
        while (!cursor.isBefore(from)) {
            if (isFasting(days, cursor)) {
                val done = byDate[cursor]?.status == CheckInStatus.DONE
                if (cursor == today && !done) {
                    cursor = cursor.minusDays(1)
                    continue
                }
                if (!done) break
                current += 1
            }
            cursor = cursor.minusDays(1)
        }

        var best = 0
        var run = 0
        var day = from
        while (!day.isAfter(today)) {
            if (isFasting(days, day)) {
                if (byDate[day]?.status == CheckInStatus.DONE) {
                    run += 1
                    if (run > best) best = run
                } else if (day != today) {
                    run = 0
                }
            }
            day = day.plusDays(1)
        }
        if (current > best) best = current
        return StreakResponse(current = current, best = best)
    }

    private fun lunarDays(userId: UUID): Set<Int> {
        val profile = fastingProfileRepository.findByUserIdWithDetails(userId).orElse(null)
        return profile?.let { fastingService.lunarDaysForProfile(it) }?.ifEmpty { setOf(1, 15) } ?: setOf(1, 15)
    }

    private fun isFasting(lunarDays: Set<Int>, date: LocalDate): Boolean {
        val lunar = VietnameseLunarCalendar.fromSolar(date.year, date.monthValue, date.dayOfMonth)
        return VietnameseLunarCalendar.isFastingDay(lunar, lunarDays)
    }

    private fun toResponse(entity: CheckInEntity) =
        CheckInResponse(
            localDate = entity.localDate.toString(),
            status = entity.status,
            note = entity.note,
            updatedAt = entity.updatedAt.toString(),
        )

    private companion object {
        const val LOOKBACK_DAYS = 400L
    }
}
