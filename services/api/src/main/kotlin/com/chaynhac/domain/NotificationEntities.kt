package com.chaynhac.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(
    name = "device_tokens",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "token"])],
)
class DeviceTokenEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(nullable = false)
    val platform: String,
    @Column(nullable = false)
    val token: String,
    @Column(name = "notifications_enabled", nullable = false)
    var notificationsEnabled: Boolean,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)

@Entity
@Table(name = "notification_log")
class NotificationLogEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "fasting_date", nullable = false)
    val fastingDate: LocalDate,
    @Column(name = "slot_key", nullable = false)
    val slotKey: String,
    @Column(name = "dedupe_key", nullable = false, unique = true)
    val dedupeKey: String,
    @Column(name = "scheduled_at", nullable = false)
    val scheduledAt: Instant,
    @Column(name = "sent_at")
    var sentAt: Instant? = null,
    @Column(nullable = false)
    var status: String,
    @Column(nullable = false)
    var attempts: Int = 0,
    @Column(nullable = false)
    val title: String,
    @Column(nullable = false)
    val body: String,
    @Column
    var error: String? = null,
)
