package com.chaynhac.fasting

import com.chaynhac.common.ApiException
import com.chaynhac.domain.FastingPreset
import com.chaynhac.domain.FastingProfileEntity
import com.chaynhac.domain.FastingRuleEntity
import com.chaynhac.domain.FastingRuleType
import com.chaynhac.domain.ReminderPreferenceEntity
import com.chaynhac.domain.ReminderSlotKey
import com.chaynhac.domain.UserEntity
import com.chaynhac.repository.FastingProfileRepository
import com.chaynhac.repository.ReminderPreferenceRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.time.LocalTime
import java.util.UUID

data class FastingRuleDto(
    val type: FastingRuleType,
    val lunarDay: Int? = null,
    val weekday: Int? = null,
)

data class ReminderPreferenceDto(
    val slotKey: ReminderSlotKey,
    val enabled: Boolean,
    val offsetDays: Int,
    val localTime: String,
)

/** Fasting preset, rules, and reminder schedule for a user. */
data class FastingProfileResponse(
    val preset: FastingPreset,
    val rules: List<FastingRuleDto>,
    val reminders: List<ReminderPreferenceDto>,
    val updatedAt: String,
)

data class UpdateFastingProfileRequest(
    val preset: FastingPreset,
    val customLunarDays: List<Int>? = null,
)

data class UpdateRemindersRequest(
    val reminders: List<ReminderPreferenceDto>,
)

/**
 * Manages fasting presets (first day, full moon, custom lunar days) and reminder slots.
 * New users receive [FastingPreset.MUNG_1_AND_15] with default evening/morning reminders.
 */
@Service
class FastingService(
    private val fastingProfileRepository: FastingProfileRepository,
    private val reminderPreferenceRepository: ReminderPreferenceRepository,
) {
    @Transactional
    fun createDefaultProfile(user: UserEntity, preset: FastingPreset) {
        val profile = FastingProfileEntity(user = user, preset = preset)
        applyPresetRules(profile, preset, null)
        applyDefaultReminders(profile)
        fastingProfileRepository.save(profile)
    }

    @Transactional(readOnly = true)
    fun getProfile(userId: UUID): FastingProfileResponse {
        val profile = findProfileOrThrow(userId)
        return toResponse(profile)
    }

    @Transactional
    fun updateProfile(userId: UUID, request: UpdateFastingProfileRequest): FastingProfileResponse {
        val profile = findProfileOrThrow(userId)
        profile.preset = request.preset
        profile.rules.clear()
        applyPresetRules(profile, request.preset, request.customLunarDays)
        profile.updatedAt = Instant.now()
        return toResponse(fastingProfileRepository.save(profile))
    }

    @Transactional
    fun updateReminders(userId: UUID, request: UpdateRemindersRequest): FastingProfileResponse {
        val profile = findProfileOrThrow(userId)

        // Delete+flush first, then insert. In-place clear()+add can INSERT before DELETE
        // and trip UNIQUE(profile_id, slot_key).
        reminderPreferenceRepository.deleteAllByProfileId(profile.id)
        profile.reminders.clear()

        request.reminders
            .associateBy { it.slotKey }
            .values
            .forEach { dto ->
                profile.reminders.add(
                    ReminderPreferenceEntity(
                        profile = profile,
                        slotKey = dto.slotKey,
                        enabled = dto.enabled,
                        offsetDays = dto.offsetDays,
                        localTime = LocalTime.parse(dto.localTime),
                    ),
                )
            }
        profile.updatedAt = Instant.now()
        return toResponse(fastingProfileRepository.save(profile))
    }

    /** Lunar day numbers (1–30) that count as fasting days for this profile. */
    fun lunarDaysForProfile(profile: FastingProfileEntity): Set<Int> =
        profile.rules
            .filter { it.type == FastingRuleType.LUNAR_DAY && it.lunarDay != null }
            .mapNotNull { it.lunarDay }
            .toSet()

    private fun findProfileOrThrow(userId: UUID): FastingProfileEntity =
        fastingProfileRepository.findByUserIdWithDetails(userId).orElseThrow {
            ApiException("PROFILE_NOT_FOUND", "Fasting profile not found", HttpStatus.NOT_FOUND)
        }

    private fun applyPresetRules(
        profile: FastingProfileEntity,
        preset: FastingPreset,
        customLunarDays: List<Int>?,
    ) {
        val days =
            when (preset) {
                FastingPreset.MUNG_1 -> listOf(1)
                FastingPreset.DAY_15 -> listOf(15)
                FastingPreset.MUNG_1_AND_15 -> listOf(1, 15)
                FastingPreset.CUSTOM -> customLunarDays?.distinct()?.sorted()
                    ?: throw ApiException("VALIDATION_ERROR", "customLunarDays required for CUSTOM preset")
            }
        if (days.any { it !in 1..30 }) {
            throw ApiException("VALIDATION_ERROR", "lunar days must be between 1 and 30")
        }
        days.forEach { day ->
            profile.rules.add(
                FastingRuleEntity(profile = profile, type = FastingRuleType.LUNAR_DAY, lunarDay = day),
            )
        }
    }

    private fun applyDefaultReminders(profile: FastingProfileEntity) {
        profile.reminders.add(
            ReminderPreferenceEntity(
                profile = profile,
                slotKey = ReminderSlotKey.EVE_BEFORE,
                enabled = true,
                offsetDays = -1,
                localTime = LocalTime.of(20, 0),
            ),
        )
        profile.reminders.add(
            ReminderPreferenceEntity(
                profile = profile,
                slotKey = ReminderSlotKey.MORNING,
                enabled = true,
                offsetDays = 0,
                localTime = LocalTime.of(7, 0),
            ),
        )
    }

    private fun toResponse(profile: FastingProfileEntity): FastingProfileResponse =
        FastingProfileResponse(
            preset = profile.preset,
            rules =
                profile.rules.map {
                    FastingRuleDto(type = it.type, lunarDay = it.lunarDay, weekday = it.weekday)
                },
            reminders =
                profile.reminders.map {
                    ReminderPreferenceDto(
                        slotKey = it.slotKey,
                        enabled = it.enabled,
                        offsetDays = it.offsetDays,
                        localTime = it.localTime.toString(),
                    )
                },
            updatedAt = profile.updatedAt.toString(),
        )
}
