package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.JwtService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.domain.FastingPreset
import com.chaynhac.domain.ReminderSlotKey
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

    @Test
    fun updateRemindersAddsFollowupAndCanBeSavedAgain() {
        val email = "rem-${UUID.randomUUID()}@sen.test"
        val tokens = authService.register(RegisterRequest(email, "password123"))

        fun body(followupTime: String, includeFollowup: Boolean = true): String {
            val reminders =
                mutableListOf(
                    mapOf("slotKey" to "EVE_BEFORE", "enabled" to true, "offsetDays" to -1, "localTime" to "20:00"),
                    mapOf("slotKey" to "MORNING", "enabled" to false, "offsetDays" to 0, "localTime" to "08:30"),
                )
            if (includeFollowup) {
                reminders += mapOf("slotKey" to "FOLLOWUP", "enabled" to true, "offsetDays" to 0, "localTime" to followupTime)
            }
            return objectMapper.writeValueAsString(mapOf("reminders" to reminders))
        }

        fun putReminders(content: String) =
            mockMvc.put("/api/v1/fasting/reminders") {
                header("Authorization", "Bearer ${tokens.accessToken}")
                contentType = MediaType.APPLICATION_JSON
                this.content = content
            }.andExpect {
                status { isOk() }
            }.andReturn()

        val created = objectMapper.readTree(putReminders(body("12:00")).response.contentAsString)
        assertEquals(3, created["reminders"].size())
        val followup = created["reminders"].first { it["slotKey"].asText() == ReminderSlotKey.FOLLOWUP.name }
        assertEquals(true, followup["enabled"].asBoolean())
        assertEquals("12:00", followup["localTime"].asText())
        val morning = created["reminders"].first { it["slotKey"].asText() == ReminderSlotKey.MORNING.name }
        assertEquals(false, morning["enabled"].asBoolean())
        assertEquals("08:30", morning["localTime"].asText())

        val updated = objectMapper.readTree(putReminders(body("13:15")).response.contentAsString)
        val followupAgain = updated["reminders"].first { it["slotKey"].asText() == ReminderSlotKey.FOLLOWUP.name }
        assertEquals("13:15", followupAgain["localTime"].asText())

        val removed = objectMapper.readTree(putReminders(body("12:00", includeFollowup = false)).response.contentAsString)
        assertEquals(2, removed["reminders"].size())
        assertTrue(removed["reminders"].none { it["slotKey"].asText() == ReminderSlotKey.FOLLOWUP.name })
    }
}
