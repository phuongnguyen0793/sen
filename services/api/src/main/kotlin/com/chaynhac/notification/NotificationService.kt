package com.chaynhac.notification

import com.chaynhac.calendar.VietnameseLunarCalendar
import com.chaynhac.common.ApiException
import com.chaynhac.domain.DeviceTokenEntity
import com.chaynhac.domain.NotificationLogEntity
import com.chaynhac.fasting.FastingService
import com.chaynhac.repository.DeviceTokenRepository
import com.chaynhac.repository.FastingProfileRepository
import com.chaynhac.repository.NotificationLogRepository
import com.chaynhac.user.UserService
import org.springframework.http.MediaType
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

data class PushTokenRequest(
    val platform: String,
    val token: String,
    val notificationsEnabled: Boolean = true,
)

data class NotificationStatusRequest(val notificationsEnabled: Boolean)

@Service
class NotificationService(
    private val deviceTokenRepository: DeviceTokenRepository,
    private val notificationLogRepository: NotificationLogRepository,
    private val fastingProfileRepository: FastingProfileRepository,
    private val fastingService: FastingService,
    private val userService: UserService,
) {
    private val http = RestClient.create()

    @Transactional
    fun registerToken(userId: UUID, request: PushTokenRequest) {
        val platform = request.platform.lowercase()
        if (platform !in setOf("ios", "android")) {
            throw ApiException("VALIDATION_ERROR", "Platform must be ios or android")
        }
        if (request.token.isBlank() || request.token.length > 512) {
            throw ApiException("VALIDATION_ERROR", "Push token is missing")
        }
        val user = userService.findActiveUser(userId)
        val existing = deviceTokenRepository.findByUserIdAndToken(userId, request.token).orElse(null)
        if (existing == null) {
            deviceTokenRepository.save(
                DeviceTokenEntity(
                    user = user,
                    platform = platform,
                    token = request.token.trim(),
                    notificationsEnabled = request.notificationsEnabled,
                ),
            )
        } else {
            existing.notificationsEnabled = request.notificationsEnabled
            existing.updatedAt = Instant.now()
            deviceTokenRepository.save(existing)
        }
    }

    @Transactional
    fun updateStatus(userId: UUID, enabled: Boolean) {
        deviceTokenRepository.findByUserId(userId).forEach {
            it.notificationsEnabled = enabled
            it.updatedAt = Instant.now()
        }
    }

    /** Rebuilds pending reminders for the next 60 days. Safe to call after every schedule change. */
    @Transactional
    fun reschedule(userId: UUID) {
        val user = userService.findActiveUser(userId)
        notificationLogRepository.deleteByUserIdAndStatus(userId, "PENDING")
        notificationLogRepository.flush()
        val profile = fastingProfileRepository.findByUserIdWithDetails(userId).orElse(null) ?: return
        val lunarDays = fastingService.lunarDaysForProfile(profile).ifEmpty { return }
        val zone = ZoneId.of(user.timezone)
        val start = LocalDate.now(zone)
        val localeVi = user.locale.startsWith("vi")
        var date = start
        val end = start.plusDays(60)
        while (!date.isAfter(end)) {
            val lunar = VietnameseLunarCalendar.fromSolar(date.year, date.monthValue, date.dayOfMonth)
            if (VietnameseLunarCalendar.isFastingDay(lunar, lunarDays)) {
                val phrase = lunarPhrase(lunar.day, lunar.month, localeVi)
                profile.reminders.filter { it.enabled }.forEach { slot ->
                    val whenDate = date.plusDays(slot.offsetDays.toLong())
                    val scheduled = whenDate.atTime(slot.localTime).atZone(zone).toInstant()
                    if (scheduled.isAfter(Instant.now())) {
                        val dedupe = "$userId|$date|${slot.slotKey}"
                        if (notificationLogRepository.findByDedupeKey(dedupe).isEmpty) {
                        notificationLogRepository.save(
                            NotificationLogEntity(
                                user = user,
                                fastingDate = date,
                                slotKey = slot.slotKey.name,
                                dedupeKey = dedupe,
                                scheduledAt = scheduled,
                                status = "PENDING",
                                title = "Sen",
                                body = reminderBody(slot.offsetDays, phrase, localeVi),
                            ),
                        )
                        }
                    }
                }
            }
            date = date.plusDays(1)
        }
    }

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    fun dispatchDue() {
        val due = notificationLogRepository.findTop20ByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
            "PENDING",
            Instant.now(),
        )
        due.forEach { job ->
            val tokens = deviceTokenRepository.findByUserIdAndNotificationsEnabledTrue(job.user.id)
            if (tokens.isEmpty()) return@forEach
            try {
                send(tokens.map { it.token }, job.title, job.body, job.fastingDate.toString())
                job.status = "SENT"
                job.sentAt = Instant.now()
                job.error = null
            } catch (ex: Exception) {
                job.status = "FAILED"
                job.error = ex.message?.take(300)
            }
            notificationLogRepository.save(job)
        }
    }

    private fun send(tokens: List<String>, title: String, body: String, fastingDate: String) {
        val messages = tokens.filter { it.startsWith("ExponentPushToken") }.map {
            mapOf(
                "to" to it,
                "title" to title,
                "body" to body,
                "data" to mapOf("type" to "FASTING_REMINDER", "fastingDate" to fastingDate, "deepLink" to "sen://home"),
            )
        }
        if (messages.isEmpty()) return
        http.post()
            .uri("https://exp.host/--/api/v2/push/send")
            .contentType(MediaType.APPLICATION_JSON)
            .body(messages)
            .retrieve()
            .toBodilessEntity()
    }

    private fun lunarPhrase(day: Int, month: Int, vi: Boolean): String =
        when {
            vi && day == 1 -> "mùng 1 tháng $month"
            vi && day == 15 -> "rằm tháng $month"
            vi -> "$day tháng $month"
            day == 1 -> "the 1st of lunar month $month"
            day == 15 -> "the full moon of lunar month $month"
            else -> "lunar day $day of month $month"
        }

    private fun reminderBody(offsetDays: Int, phrase: String, vi: Boolean): String =
        if (vi) {
            if (offsetDays < 0) "Ngày mai là $phrase — nhớ ăn chay nhé." else "Hôm nay là $phrase — nhớ ăn chay nhé."
        } else {
            if (offsetDays < 0) "Tomorrow is $phrase — remember to fast." else "Today is $phrase — remember to fast."
        }
}
