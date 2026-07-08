package com.chaynhac.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant
import java.util.UUID

/** Application user; soft-deleted via [deletedAt]. */
@Entity
@Table(name = "users")
class UserEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @Column(nullable = false)
    var displayName: String,
    @Column(nullable = false, unique = true)
    var email: String,
    @Column(name = "password_hash")
    var passwordHash: String? = null,
    @Column(nullable = false)
    var timezone: String = "Asia/Ho_Chi_Minh",
    @Column(nullable = false)
    var locale: String = "vi-VN",
    @Column(nullable = false)
    var preferNoOnionGarlic: Boolean = false,
    @Column(nullable = false)
    val createdAt: Instant = Instant.now(),
    var deletedAt: Instant? = null,
)
