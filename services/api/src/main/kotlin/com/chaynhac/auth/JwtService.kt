package com.chaynhac.auth

import com.chaynhac.common.ApiException
import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.nio.charset.StandardCharsets
import java.time.Instant
import java.util.Date
import java.util.UUID
import javax.crypto.SecretKey

/** Signs and validates HMAC-SHA256 JWT access tokens; issues opaque refresh token values. */
@Service
class JwtService(
    @Value("\${sen.jwt.secret}") secret: String,
    @Value("\${sen.jwt.access-token-minutes}") private val accessMinutes: Long,
    @Value("\${sen.jwt.refresh-token-days}") private val refreshDays: Long,
) {
    private val key: SecretKey = Keys.hmacShaKeyFor(secret.toByteArray(StandardCharsets.UTF_8))

    fun createAccessToken(userId: UUID, email: String): String {
        val now = Instant.now()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("type", "access")
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(accessMinutes * 60)))
            .signWith(key)
            .compact()
    }

    /** Opaque refresh token stored hashed in the database (not a JWT). */
    fun createRefreshTokenValue(): String = UUID.randomUUID().toString() + "." + UUID.randomUUID()

    fun refreshTokenExpiresAt(): Instant = Instant.now().plusSeconds(refreshDays * 24 * 60 * 60)

    fun parseAccessToken(token: String): Claims =
        try {
            Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .payload
        } catch (_: Exception) {
            throw ApiException("INVALID_TOKEN", "Invalid or expired access token", HttpStatus.UNAUTHORIZED)
        }

    fun userIdFromAccessToken(token: String): UUID {
        val claims = parseAccessToken(token)
        if (claims["type"] != "access") {
            throw ApiException("INVALID_TOKEN", "Not an access token", HttpStatus.UNAUTHORIZED)
        }
        return UUID.fromString(claims.subject)
    }
}
