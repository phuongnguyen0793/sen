package com.chaynhac.repository

import com.chaynhac.domain.AuthIdentityEntity
import com.chaynhac.domain.AuthProvider
import com.chaynhac.domain.FastingProfileEntity
import com.chaynhac.domain.RefreshTokenEntity
import com.chaynhac.domain.ReminderPreferenceEntity
import com.chaynhac.domain.UserEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
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

interface ReminderPreferenceRepository : JpaRepository<ReminderPreferenceEntity, UUID> {
    /** Hard-delete before re-insert so UNIQUE(profile_id, slot_key) cannot collide mid-flush. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ReminderPreferenceEntity r WHERE r.profile.id = :profileId")
    fun deleteAllByProfileId(@Param("profileId") profileId: UUID)
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
