package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.JwtService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.domain.AuthIdentityEntity
import com.chaynhac.domain.AuthProvider
import com.chaynhac.repository.AuthIdentityRepository
import com.chaynhac.repository.UserRepository
import com.chaynhac.user.UserService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OAuthApiIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var objectMapper: ObjectMapper
    @Autowired private lateinit var authService: AuthService
    @Autowired private lateinit var jwtService: JwtService
    @Autowired private lateinit var userService: UserService
    @Autowired private lateinit var userRepository: UserRepository
    @Autowired private lateinit var authIdentityRepository: AuthIdentityRepository

    @Test
    fun googleIsRejectedUntilClientIdsAreConfigured() {
        mockMvc.post("/api/v1/auth/oauth/google") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("idToken" to "not-a-token"))
        }.andExpect {
            status { isNotImplemented() }
            jsonPath("$.code") { value("OAUTH_NOT_CONFIGURED") }
        }
    }

    @Test
    fun unknownProviderIsRejected() {
        mockMvc.post("/api/v1/auth/oauth/facebook") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("idToken" to "token"))
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("OAUTH_PROVIDER") }
        }
    }

    @Test
    fun malformedAppleTokenIsRejected() {
        mockMvc.post("/api/v1/auth/oauth/apple") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("idToken" to "%%%"))
        }.andExpect {
            status { isUnauthorized() }
            jsonPath("$.code") { value("INVALID_ID_TOKEN") }
        }
    }

    @Test
    fun deletingAnAccountReleasesTheAppleSubject() {
        val tokens = authService.register(RegisterRequest("oauth-delete-${java.util.UUID.randomUUID()}@sen.test", "password123"))
        val userId = jwtService.userIdFromAccessToken(tokens.accessToken)
        val user = userRepository.findById(userId).orElseThrow()
        authIdentityRepository.save(AuthIdentityEntity(user = user, provider = AuthProvider.APPLE, providerSubject = "apple-$userId"))
        userService.deleteAccount(userId)
        assertTrue(authIdentityRepository.findByProviderAndProviderSubject(AuthProvider.APPLE, "apple-$userId").isEmpty)
    }

    @Test
    fun blankAppleTokenIsRejectedBeforeAnyNetworkCall() {
        mockMvc.post("/api/v1/auth/oauth/apple") {
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("idToken" to " "))
        }.andExpect {
            status { isBadRequest() }
            jsonPath("$.code") { value("VALIDATION_ERROR") }
        }
    }
}
