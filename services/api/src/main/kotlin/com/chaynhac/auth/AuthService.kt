package com.chaynhac.auth

import com.chaynhac.common.ApiException
import com.chaynhac.domain.AuthIdentityEntity
import com.chaynhac.domain.AuthProvider
import com.chaynhac.domain.FastingPreset
import com.chaynhac.domain.RefreshTokenEntity
import com.chaynhac.domain.UserEntity
import com.chaynhac.fasting.FastingService
import com.chaynhac.repository.AuthIdentityRepository
import com.chaynhac.repository.RefreshTokenRepository
import com.chaynhac.repository.UserRepository
import org.springframework.http.HttpStatus
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.security.MessageDigest
import java.util.UUID

/** JWT access token plus opaque refresh token returned by auth endpoints. */
data class TokenPairResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresInSeconds: Long,
)

data class RegisterRequest(
    val email: String,
    val password: String,
    val displayName: String? = null,
)

data class LoginRequest(
    val email: String,
    val password: String,
)

data class RefreshRequest(
    val refreshToken: String,
)

data class OAuthRequest(
    val idToken: String,
)

/**
 * Email/password registration, login, token refresh, and logout.
 * Refresh tokens are stored hashed (SHA-256) and rotated on each refresh.
 */
@Service
class AuthService(
    private val userRepository: UserRepository,
    private val authIdentityRepository: AuthIdentityRepository,
    private val refreshTokenRepository: RefreshTokenRepository,
    private val jwtService: JwtService,
    private val passwordEncoder: PasswordEncoder,
    private val fastingService: FastingService,
) {
    @Transactional
    fun register(request: RegisterRequest): TokenPairResponse {
        val email = request.email.trim().lowercase()
        if (email.isBlank() || request.password.length < 8) {
            throw ApiException("VALIDATION_ERROR", "Email required and password must be at least 8 characters")
        }
        if (userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).isPresent) {
            throw ApiException("EMAIL_EXISTS", "Email already registered", HttpStatus.CONFLICT)
        }

        val user =
            userRepository.save(
                UserEntity(
                    displayName = request.displayName?.trim()?.ifBlank { email.substringBefore("@") }
                        ?: email.substringBefore("@"),
                    email = email,
                    passwordHash = passwordEncoder.encode(request.password),
                ),
            )
        authIdentityRepository.save(
            AuthIdentityEntity(user = user, provider = AuthProvider.PASSWORD, providerSubject = email),
        )
        fastingService.createDefaultProfile(user, FastingPreset.MUNG_1_AND_15)
        return issueTokens(user)
    }

    @Transactional
    fun login(request: LoginRequest): TokenPairResponse {
        val email = request.email.trim().lowercase()
        val user =
            userRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email).orElseThrow {
                ApiException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED)
            }
        val hash = user.passwordHash
            ?: throw ApiException("INVALID_CREDENTIALS", "Use OAuth login for this account", HttpStatus.UNAUTHORIZED)
        if (!passwordEncoder.matches(request.password, hash)) {
            throw ApiException("INVALID_CREDENTIALS", "Invalid email or password", HttpStatus.UNAUTHORIZED)
        }
        return issueTokens(user)
    }

    @Transactional
    fun refresh(request: RefreshRequest): TokenPairResponse {
        val hash = hashToken(request.refreshToken)
        val stored =
            refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash).orElseThrow {
                ApiException("INVALID_REFRESH_TOKEN", "Refresh token invalid", HttpStatus.UNAUTHORIZED)
            }
        if (stored.expiresAt.isBefore(java.time.Instant.now())) {
            throw ApiException("INVALID_REFRESH_TOKEN", "Refresh token expired", HttpStatus.UNAUTHORIZED)
        }
        stored.revokedAt = java.time.Instant.now()
        refreshTokenRepository.save(stored)
        return issueTokens(stored.user)
    }

    @Transactional
    fun logout(request: RefreshRequest) {
        val hash = hashToken(request.refreshToken)
        refreshTokenRepository.findByTokenHashAndRevokedAtIsNull(hash).ifPresent {
            it.revokedAt = java.time.Instant.now()
            refreshTokenRepository.save(it)
        }
    }

    fun oauthNotImplemented(provider: String): Nothing =
        throw ApiException(
            "OAUTH_NOT_IMPLEMENTED",
            "OAuth for $provider is not implemented yet — use email/password in MVP scaffold",
            HttpStatus.NOT_IMPLEMENTED,
        )

    private fun issueTokens(user: UserEntity): TokenPairResponse {
        val refreshValue = jwtService.createRefreshTokenValue()
        refreshTokenRepository.save(
            RefreshTokenEntity(
                user = user,
                tokenHash = hashToken(refreshValue),
                expiresAt = jwtService.refreshTokenExpiresAt(),
            ),
        )
        return TokenPairResponse(
            accessToken = jwtService.createAccessToken(user.id, user.email),
            refreshToken = refreshValue,
            expiresInSeconds = 15 * 60,
        )
    }

    private fun hashToken(token: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(token.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
