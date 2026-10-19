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
import org.springframework.http.client.SimpleClientHttpRequestFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component
import org.springframework.stereotype.Service
import org.springframework.transaction.PlatformTransactionManager
import org.springframework.transaction.annotation.Transactional
import org.springframework.transaction.support.TransactionTemplate
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException
import java.time.Duration
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

private const val MAX_ATTEMPTS = 30
private val EXPO_UUID = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")

internal fun isExpoPushToken(token: String): Boolean {
    val trimmed = token.trim()
    val bracketed =
        (trimmed.startsWith("ExponentPushToken[") || trimmed.startsWith("ExpoPushToken[")) && trimmed.endsWith("]")
    return bracketed || EXPO_UUID.matches(trimmed)
}

internal data class ExpoReceipt(
    val delivered: Boolean,
    val retry: Boolean,
    val error: String?,
    val deadTokens: List<String> = emptyList(),
)

/** Reads Expo's per-message tickets. A transport-shaped empty body is retried; a dead device is not. */
internal fun interpretExpoTickets(body: Map<*, *>, tokens: List<String>): ExpoReceipt {
    val data = body["data"] as? List<*>
        ?: return ExpoReceipt(delivered = false, retry = true, error = "Expo response had no tickets")
    if (data.isEmpty()) return ExpoReceipt(delivered = false, retry = true, error = "Expo response had no tickets")
    var delivered = 0
    val errors = mutableListOf<String>()
    val dead = mutableListOf<String>()
    data.forEachIndexed { index, ticket ->
        val row = ticket as? Map<*, *> ?: return@forEachIndexed
        if (row["status"] == "ok") {
            delivered++
        } else {
            val detail = (row["details"] as? Map<*, *>)?.get("error")?.toString()
            if (detail == "DeviceNotRegistered") tokens.getOrNull(index)?.let { dead += it }
            errors += row["message"]?.toString() ?: detail ?: "Expo push error"
        }
    }
    if (delivered > 0) return ExpoReceipt(delivered = true, retry = false, error = errors.firstOrNull(), deadTokens = dead)
    val permanent = dead.size == data.size
    return ExpoReceipt(delivered = false, retry = !permanent, error = errors.firstOrNull() ?: "Expo push error", deadTokens = dead)
}

@Service
class NotificationService(
    private val deviceTokenRepository: DeviceTokenRepository,
    private val notificationLogRepository: NotificationLogRepository,
    private val fastingProfileRepository: FastingProfileRepository,
    private val fastingService: FastingService,
    private val userService: UserService,
    transactionManager: PlatformTransactionManager,
) {
    private val transactions = TransactionTemplate(transactionManager)
    private val http = RestClient.builder()
        .requestFactory(
            SimpleClientHttpRequestFactory().apply {
                setConnectTimeout(Duration.ofSeconds(5))
                setReadTimeout(Duration.ofSeconds(15))
            },
        )
        .build()

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
        reschedule(userId)
    }

    @Transactional
    fun updateStatus(userId: UUID, enabled: Boolean) {
        deviceTokenRepository.findByUserId(userId).forEach {
            it.notificationsEnabled = enabled
            it.updatedAt = Instant.now()
        }
        if (enabled) {
            reschedule(userId)
        } else {
            notificationLogRepository.deleteByUserIdAndStatus(userId, "PENDING")
        }
    }

    /** Rebuilds future pending reminders for the next 60 days. Safe to call after every schedule change. */
    @Transactional
    fun reschedule(userId: UUID) {
        val user = userService.findActiveUser(userId)
        notificationLogRepository.deleteByUserIdAndStatusAndScheduledAtAfter(userId, "PENDING", Instant.now())
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
                        val existing = notificationLogRepository.findByDedupeKey(dedupe)
                        if (existing.isPresent && existing.get().status == "SENT") {
                            return@forEach
                        }
                        if (existing.isPresent) {
                            notificationLogRepository.delete(existing.get())
                            notificationLogRepository.flush()
                        }
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
            date = date.plusDays(1)
        }
    }

    @Scheduled(fixedDelay = 60_000)
    fun dispatchDue() {
        val due = transactions.execute {
            notificationLogRepository.findTop20ByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                "PENDING",
                Instant.now(),
            ).map {
                DueJob(it.id, it.user.id, it.title, it.body, it.fastingDate.toString())
            }
        }.orEmpty()
        due.forEach { deliver(it) }
    }

    private fun deliver(job: DueJob) {
        val tokens = transactions.execute {
            deviceTokenRepository.findByUserIdAndNotificationsEnabledTrue(job.userId).map { it.token }
        }.orEmpty()
        if (tokens.isEmpty()) {
            record(job.id) {
                it.status = "SKIPPED"
                it.error = "No enabled device token"
            }
            return
        }
        val receipt = try {
            send(tokens, job.title, job.body, job.fastingDate)
        } catch (ex: Exception) {
            ExpoReceipt(delivered = false, retry = true, error = ex.message)
        }
        record(job.id) { entity ->
            receipt.deadTokens.forEach { token ->
                deviceTokenRepository.findByUserIdAndToken(job.userId, token).ifPresent {
                    it.notificationsEnabled = false
                    it.updatedAt = Instant.now()
                }
            }
            when {
                receipt.delivered -> {
                    entity.status = "SENT"
                    entity.sentAt = Instant.now()
                    entity.error = null
                }
                receipt.retry -> {
                    val attempts = entity.attempts + 1
                    entity.attempts = attempts
                    entity.error = receipt.error?.take(300)
                    entity.status = if (attempts >= MAX_ATTEMPTS) "FAILED" else "PENDING"
                }
                else -> {
                    entity.status = "FAILED"
                    entity.error = receipt.error?.take(300)
                }
            }
        }
    }

    private fun record(jobId: UUID, update: (NotificationLogEntity) -> Unit) {
        transactions.executeWithoutResult {
            notificationLogRepository.findById(jobId).ifPresent(update)
        }
    }

    private fun send(tokens: List<String>, title: String, body: String, fastingDate: String): ExpoReceipt {
        val accepted = tokens.map { it.trim() }.filter { isExpoPushToken(it) }
        if (accepted.isEmpty()) {
            return ExpoReceipt(delivered = false, retry = false, error = "No Expo push token")
        }
        val messages = accepted.map {
            mapOf(
                "to" to it,
                "title" to title,
                "body" to body,
                "data" to mapOf("type" to "FASTING_REMINDER", "fastingDate" to fastingDate, "deepLink" to "sen://home"),
            )
        }
        val raw = try {
            http.post()
                .uri("https://exp.host/--/api/v2/push/send")
                .contentType(MediaType.APPLICATION_JSON)
                .body(messages)
                .retrieve()
                .body(Map::class.java)
        } catch (ex: RestClientException) {
            return ExpoReceipt(delivered = false, retry = true, error = ex.message)
        }
        return interpretExpoTickets(raw ?: emptyMap<String, Any>(), accepted)
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

private data class DueJob(
    val id: UUID,
    val userId: UUID,
    val title: String,
    val body: String,
    val fastingDate: String,
)

/** Refills the 60-day window so reminders continue after the last planned day is sent. */
@Component
class NotificationHorizonJob(
    private val notificationService: NotificationService,
    private val deviceTokenRepository: DeviceTokenRepository,
) {
    @Scheduled(cron = "0 30 4 * * *")
    fun extendReminderHorizon() {
        deviceTokenRepository.findUserIdsWithNotificationsEnabled().forEach { userId ->
            runCatching { notificationService.reschedule(userId) }
        }
    }
}
