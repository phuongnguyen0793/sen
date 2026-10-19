package com.chaynhac.repository

import com.chaynhac.domain.AiGenerationEntity
import com.chaynhac.domain.BookmarkEntity
import com.chaynhac.domain.CheckInEntity
import com.chaynhac.domain.RecipeEntity
import com.chaynhac.domain.AuthIdentityEntity
import com.chaynhac.domain.AuthProvider
import com.chaynhac.domain.FastingProfileEntity
import com.chaynhac.domain.RefreshTokenEntity
import com.chaynhac.domain.UserEntity
import jakarta.persistence.LockModeType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Lock
import org.springframework.data.jpa.repository.Query
import java.time.Instant
import java.time.LocalDate
import java.util.Optional
import java.util.UUID

interface UserRepository : JpaRepository<UserEntity, UUID> {
    fun findByEmailIgnoreCaseAndDeletedAtIsNull(email: String): Optional<UserEntity>

    fun findByIdAndDeletedAtIsNull(id: UUID): Optional<UserEntity>

    /** Serializes quota checks so two suggestions cannot both pass the daily limit. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM UserEntity u WHERE u.id = :id AND u.deletedAt IS NULL")
    fun findActiveByIdForUpdate(id: UUID): Optional<UserEntity>
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
