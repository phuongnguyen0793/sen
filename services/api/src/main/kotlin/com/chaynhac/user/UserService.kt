package com.chaynhac.user

import com.chaynhac.common.ApiException
import com.chaynhac.domain.UserEntity
import com.chaynhac.repository.AuthIdentityRepository
import com.chaynhac.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.DateTimeException
import java.time.Instant
import java.time.ZoneId
import java.util.UUID

/** Public user profile returned by `/api/v1/me`. */
data class UserProfileResponse(
    val id: UUID,
    val displayName: String,
    val email: String,
    val timezone: String,
    val locale: String,
    val preferNoOnionGarlic: Boolean,
)

data class UpdateUserRequest(
    val displayName: String? = null,
    val timezone: String? = null,
    val locale: String? = null,
    val preferNoOnionGarlic: Boolean? = null,
)

private val SUPPORTED_LOCALES = setOf("vi-VN", "en-US")

/** Loads and updates active (non-deleted) user records. */
@Service
class UserService(
    private val userRepository: UserRepository,
    private val authIdentityRepository: AuthIdentityRepository,
) {
    @Transactional(readOnly = true)
    fun getProfile(userId: UUID): UserProfileResponse = toResponse(findActiveUser(userId))

    @Transactional
    fun updateProfile(userId: UUID, request: UpdateUserRequest): UserProfileResponse {
        val user = findActiveUser(userId)
        request.displayName?.let { raw ->
            val name = raw.trim()
            if (name.isEmpty() || name.length > 80) {
                throw ApiException("VALIDATION_ERROR", "Display name must be 1–80 characters")
            }
            user.displayName = name
        }
        request.timezone?.let { zone ->
            try {
                ZoneId.of(zone)
            } catch (_: DateTimeException) {
                throw ApiException("INVALID_TIMEZONE", "Unknown timezone")
            }
            user.timezone = zone
        }
        request.locale?.let { locale ->
            if (locale !in SUPPORTED_LOCALES) {
                throw ApiException("INVALID_LOCALE", "Locale must be vi-VN or en-US")
            }
            user.locale = locale
        }
        request.preferNoOnionGarlic?.let { user.preferNoOnionGarlic = it }
        return toResponse(userRepository.save(user))
    }

    /** Soft-delete: sets [UserEntity.deletedAt] and scrubs email/password. */
    @Transactional
    fun deleteAccount(userId: UUID) {
        val user = findActiveUser(userId)
        user.deletedAt = Instant.now()
        user.email = "deleted+${user.id}@sen.local"
        user.passwordHash = null
        user.displayName = "Deleted"
        userRepository.save(user)
        authIdentityRepository.deleteByUserId(userId)
    }

    fun findActiveUser(userId: UUID): UserEntity =
        userRepository.findByIdAndDeletedAtIsNull(userId).orElseThrow {
            ApiException("USER_NOT_FOUND", "User not found", HttpStatus.NOT_FOUND)
        }

    private fun toResponse(user: UserEntity): UserProfileResponse =
        UserProfileResponse(
            id = user.id,
            displayName = user.displayName,
            email = user.email,
            timezone = user.timezone,
            locale = user.locale,
            preferNoOnionGarlic = user.preferNoOnionGarlic,
        )
}
