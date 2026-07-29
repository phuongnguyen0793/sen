package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.JwtService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.domain.FastingPreset
import com.chaynhac.fasting.FastingService
import com.chaynhac.fasting.UpdateFastingProfileRequest
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.put
import java.util.UUID

/** Integration tests for auth, fasting profile defaults, and calendar HTTP endpoints. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFastingApiIntegrationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var objectMapper: ObjectMapper

    @Autowired
    private lateinit var authService: AuthService

    @Autowired
    private lateinit var jwtService: JwtService

    @Autowired
    private lateinit var fastingService: FastingService

    @Test
    fun registerCreatesDefaultMung1And15Profile() {
        val email = "it-${UUID.randomUUID()}@sen.test"
        val tokens = authService.register(RegisterRequest(email, "password123", "Integration"))
        assertTrue(tokens.accessToken.isNotBlank())
        assertTrue(tokens.refreshToken.isNotBlank())

        val userId = jwtService.userIdFromAccessToken(tokens.accessToken)
        val profile = fastingService.getProfile(userId)
        assertEquals(FastingPreset.MUNG_1_AND_15, profile.preset)
        assertTrue(profile.rules.isNotEmpty())
        assertTrue(profile.reminders.isNotEmpty())
    }

    @Test
    fun calendarTodayRequiresAuth() {
        // Spring Security treats anonymous as authenticated=false → AccessDenied → 403.
        mockMvc.get("/api/v1/calendar/today").andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun registerAndCalendarTodayViaHttp() {
        val email = "http-${UUID.randomUUID()}@sen.test"
        val registerBody =
            objectMapper.writeValueAsString(
                mapOf(
                    "email" to email,
                    "password" to "password123",
                    "displayName" to "Http User",
                ),
            )

        val registerResult =
            mockMvc.post("/api/v1/auth/register") {
                contentType = MediaType.APPLICATION_JSON
                content = registerBody
            }.andExpect {
                status { isOk() }
            }.andReturn()

        val accessToken =
            objectMapper.readTree(registerResult.response.contentAsString).get("accessToken").asText()

        mockMvc.get("/api/v1/calendar/today") {
            header("Authorization", "Bearer $accessToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.isFasting") { exists() }
            jsonPath("$.solarDate") { exists() }
        }

        mockMvc.get("/api/v1/fasting/profile") {
            header("Authorization", "Bearer $accessToken")
        }.andExpect {
            status { isOk() }
            jsonPath("$.preset") { value("MUNG_1_AND_15") }
        }
    }

    @Test
    fun updateFastingPreset() {
        val email = "preset-${UUID.randomUUID()}@sen.test"
        val tokens = authService.register(RegisterRequest(email, "password123"))
        val userId = jwtService.userIdFromAccessToken(tokens.accessToken)

        val updated =
            fastingService.updateProfile(
                userId,
                UpdateFastingProfileRequest(preset = FastingPreset.DAY_15),
            )
        assertEquals(FastingPreset.DAY_15, updated.preset)

        mockMvc.put("/api/v1/fasting/profile") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content =
                objectMapper.writeValueAsString(
                    mapOf("preset" to "MUNG_1"),
                )
        }.andExpect {
            status { isOk() }
            jsonPath("$.preset") { value("MUNG_1") }
        }
    }
}
