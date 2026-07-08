package com.chaynhac.domain

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/** Per-user fasting preset with associated [FastingRuleEntity] and [ReminderPreferenceEntity] children. */
@Entity
@Table(name = "fasting_profiles")
class FastingProfileEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    val user: UserEntity,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var preset: FastingPreset,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
    @OneToMany(mappedBy = "profile", cascade = [CascadeType.ALL], orphanRemoval = true)
    val rules: MutableSet<FastingRuleEntity> = linkedSetOf(),
    @OneToMany(mappedBy = "profile", cascade = [CascadeType.ALL], orphanRemoval = true)
    val reminders: MutableSet<ReminderPreferenceEntity> = linkedSetOf(),
)

@Entity
@Table(name = "fasting_rules")
class FastingRuleEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    val profile: FastingProfileEntity,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val type: FastingRuleType,
    @Column(name = "lunar_day")
    val lunarDay: Int? = null,
    @Column
    val weekday: Int? = null,
)

@Entity
@Table(name = "reminder_preferences")
class ReminderPreferenceEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", nullable = false)
    val profile: FastingProfileEntity,
    @Enumerated(EnumType.STRING)
    @Column(name = "slot_key", nullable = false)
    val slotKey: ReminderSlotKey,
    @Column(nullable = false)
    var enabled: Boolean = true,
    @Column(name = "offset_days", nullable = false)
    var offsetDays: Int,
    @Column(name = "local_time", nullable = false)
    var localTime: java.time.LocalTime,
)
