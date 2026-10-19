package com.chaynhac.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
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
    name = "check_ins",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "local_date"])],
)
class CheckInEntity(
    @Id
    val id: UUID = UUID.randomUUID(),
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: UserEntity,
    @Column(name = "local_date", nullable = false)
    val localDate: LocalDate,
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: CheckInStatus,
    @Column
    var note: String? = null,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Instant = Instant.now(),
)
