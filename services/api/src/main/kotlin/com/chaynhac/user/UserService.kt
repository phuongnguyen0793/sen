package com.chaynhac.user

import com.chaynhac.common.ApiException
import com.chaynhac.domain.UserEntity
import com.chaynhac.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
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

/** Loads and updates active (non-deleted) user records. */
@Service
class UserService(
    private val userRepository: UserRepository,
) {
    @Transactional(readOnly = true)
    fun getProfile(userId: UUID): UserProfileResponse = toResponse(findActiveUser(userId))

    @Transactional
    fun updateProfile(userId: UUID, request: UpdateUserRequest): UserProfileResponse {
        val user = findActiveUser(userId)
        request.displayName?.let { user.displayName = it.trim() }
        request.timezone?.let { user.timezone = it }
        request.locale?.let { user.locale = it }
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
