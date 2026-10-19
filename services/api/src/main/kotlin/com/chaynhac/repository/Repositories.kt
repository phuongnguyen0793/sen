package com.chaynhac.repository

import com.chaynhac.domain.DeviceTokenEntity
import com.chaynhac.domain.NotificationLogEntity
import com.chaynhac.domain.AiGenerationEntity
import com.chaynhac.domain.BookmarkEntity
import com.chaynhac.domain.CheckInEntity
import com.chaynhac.domain.RecipeEntity
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
import java.time.Instant
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

interface ReminderPreferenceRepository : JpaRepository<ReminderPreferenceEntity, UUID> {
    /** Hard-delete before re-insert so UNIQUE(profile_id, slot_key) cannot collide mid-flush. */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ReminderPreferenceEntity r WHERE r.profile.id = :profileId")
    fun deleteAllByProfileId(@Param("profileId") profileId: UUID)
}

interface DeviceTokenRepository : JpaRepository<DeviceTokenEntity, UUID> {
    fun findByUserIdAndToken(userId: UUID, token: String): Optional<DeviceTokenEntity>

    fun findByUserId(userId: UUID): List<DeviceTokenEntity>

    fun findByUserIdAndNotificationsEnabledTrue(userId: UUID): List<DeviceTokenEntity>

    @Query("SELECT DISTINCT d.user.id FROM DeviceTokenEntity d WHERE d.notificationsEnabled = true")
    fun findUserIdsWithNotificationsEnabled(): List<UUID>
}

interface NotificationLogRepository : JpaRepository<NotificationLogEntity, UUID> {
    fun deleteByUserIdAndStatus(userId: UUID, status: String)

    fun deleteByUserIdAndStatusAndScheduledAtAfter(userId: UUID, status: String, scheduledAt: Instant)

    fun findByDedupeKey(dedupeKey: String): Optional<NotificationLogEntity>

    fun findTop20ByStatusAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
        status: String,
        scheduledAt: Instant,
    ): List<NotificationLogEntity>
}

interface RecipeRepository : JpaRepository<RecipeEntity, UUID> {
    fun findBySourceOrderByCreatedAtDesc(source: String): List<RecipeEntity>
}

interface BookmarkRepository : JpaRepository<BookmarkEntity, UUID> {
    fun findByUserIdAndRecipeId(userId: UUID, recipeId: UUID): Optional<BookmarkEntity>

    fun findByUserId(userId: UUID): List<BookmarkEntity>

    fun deleteByUserIdAndRecipeId(userId: UUID, recipeId: UUID)
}

interface AiGenerationRepository : JpaRepository<AiGenerationEntity, UUID> {
    fun countByUserIdAndCreatedAtGreaterThanEqual(userId: UUID, createdAt: Instant): Long
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
