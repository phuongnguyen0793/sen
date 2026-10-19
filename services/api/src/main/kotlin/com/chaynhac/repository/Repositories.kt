package com.chaynhac.repository

import com.chaynhac.domain.CheckInEntity
import com.chaynhac.domain.AuthIdentityEntity
import com.chaynhac.domain.AuthProvider
import com.chaynhac.domain.FastingProfileEntity
import com.chaynhac.domain.RefreshTokenEntity
import com.chaynhac.domain.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun findByEmailIgnoreCaseAndDeletedAtIsNull(email: String): Optional<UserEntity>

    fun findByIdAndDeletedAtIsNull(id: UUID): Optional<UserEntity>
}

interface AuthIdentityRepository : JpaRepository<AuthIdentityEntity, UUID> {
    fun findByProviderAndProviderSubject(
        provider: AuthProvider,
        providerSubject: String,
    ): Optional<AuthIdentityEntity>
}

interface RefreshTokenRepository : JpaRepository<RefreshTokenEntity, UUID> {
    fun findByTokenHashAndRevokedAtIsNull(tokenHash: String): Optional<RefreshTokenEntity>
}

interface CheckInRepository : JpaRepository<CheckInEntity, UUID> {
    fun findByUserIdAndLocalDate(userId: UUID, localDate: LocalDate): Optional<CheckInEntity>

    fun findByUserIdAndLocalDateBetweenOrderByLocalDateAsc(
        userId: UUID,
        from: LocalDate,
        to: LocalDate,
    ): List<CheckInEntity>
}

interface FastingProfileRepository : JpaRepository<FastingProfileEntity, UUID> {
    /** Eager-fetches rules and reminders to avoid N+1 queries in profile endpoints. */
    @Query(
        """
        SELECT p FROM FastingProfileEntity p
        LEFT JOIN FETCH p.rules
        LEFT JOIN FETCH p.reminders
        WHERE p.user.id = :userId
        """,
    )
    fun findByUserIdWithDetails(userId: UUID): Optional<FastingProfileEntity>
}
