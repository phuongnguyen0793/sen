package com.chaynhac.auth

import com.chaynhac.common.ApiException
import com.fasterxml.jackson.databind.ObjectMapper
import io.jsonwebtoken.Jwts
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import java.math.BigInteger
import java.security.KeyFactory
import java.security.PublicKey
import java.security.spec.RSAPublicKeySpec
import java.util.Base64

data class VerifiedIdentity(
    val subject: String,
    val email: String?,
    val emailVerified: Boolean,
    val displayName: String?,
)

@Component
class OAuthVerifier(
    private val objectMapper: ObjectMapper,
    @Value("\${sen.oauth.google-client-ids:}") private val googleClientIds: String,
    @Value("\${sen.oauth.apple-audience:app.sen.lunar}") private val appleAudience: String,
) {
    private val http = RestClient.create()

    fun verify(provider: String, idToken: String): VerifiedIdentity {
        if (idToken.isBlank()) throw ApiException("VALIDATION_ERROR", "idToken is required")
        return when (provider.lowercase()) {
            "google" -> verifyGoogle(idToken)
            "apple" -> verifyApple(idToken)
            else -> throw ApiException("OAUTH_PROVIDER", "Provider must be apple or google")
        }
    }

    private fun verifyGoogle(idToken: String): VerifiedIdentity {
        val allowed = googleClientIds.split(",").map { it.trim() }.filter { it.isNotEmpty() }
        if (allowed.isEmpty()) {
            throw ApiException(
                "OAUTH_NOT_CONFIGURED",
                "Set GOOGLE_CLIENT_IDS before accepting Google sign-in",
                HttpStatus.NOT_IMPLEMENTED,
            )
        }
        val body = http.get()
            .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
            .retrieve()
            .body(Map::class.java)
            ?: throw ApiException("INVALID_ID_TOKEN", "Google token was rejected", HttpStatus.UNAUTHORIZED)
        val audience = body["aud"]?.toString().orEmpty()
        if (audience !in allowed) {
            throw ApiException("INVALID_ID_TOKEN", "Google token audience does not match", HttpStatus.UNAUTHORIZED)
        }
        return VerifiedIdentity(
            subject = body["sub"]?.toString() ?: throw ApiException("INVALID_ID_TOKEN", "Google token has no subject", HttpStatus.UNAUTHORIZED),
            email = body["email"]?.toString(),
            emailVerified = body["email_verified"]?.toString() == "true",
            displayName = body["name"]?.toString(),
        )
    }

    private fun verifyApple(idToken: String): VerifiedIdentity {
        if (appleAudience.isBlank()) {
            throw ApiException("OAUTH_NOT_CONFIGURED", "Set APPLE_AUDIENCE before accepting Apple sign-in", HttpStatus.NOT_IMPLEMENTED)
        }
        val kid = objectMapper.readTree(
            String(Base64.getUrlDecoder().decode(idToken.substringBefore('.'))),
        ).path("kid").asText()
        val key = appleKeys()[kid]
            ?: throw ApiException("INVALID_ID_TOKEN", "Apple signing key was not found", HttpStatus.UNAUTHORIZED)
        val parser = Jwts.parser()
            .verifyWith(key)
            .requireIssuer("https://appleid.apple.com")
            .requireAudience(appleAudience)
            .build()
        val claims = try {
            parser.parseSignedClaims(idToken).payload
        } catch (ex: ApiException) {
            throw ex
        } catch (ex: Exception) {
            throw ApiException("INVALID_ID_TOKEN", "Apple token was rejected", HttpStatus.UNAUTHORIZED)
        }
        return VerifiedIdentity(
            subject = claims.subject,
            email = claims["email"] as? String,
            emailVerified = claims["email_verified"]?.toString() == "true",
            displayName = null,
        )
    }

    private fun appleKeys(): Map<String, PublicKey> {
        val raw = http.get().uri("https://appleid.apple.com/auth/keys").retrieve().body(String::class.java)
            ?: throw ApiException("OAUTH_UNAVAILABLE", "Apple keys could not be loaded", HttpStatus.SERVICE_UNAVAILABLE)
        val keys = objectMapper.readTree(raw).path("keys")
        return buildMap {
            keys.forEach { key ->
                val kid = key.path("kid").asText()
                val modulus = BigInteger(1, Base64.getUrlDecoder().decode(key.path("n").asText()))
                val exponent = BigInteger(1, Base64.getUrlDecoder().decode(key.path("e").asText()))
                put(kid, KeyFactory.getInstance("RSA").generatePublic(RSAPublicKeySpec(modulus, exponent)))
            }
        }
    }
}
