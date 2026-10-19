package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.JwtService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.notification.NotificationService
import com.chaynhac.repository.NotificationLogRepository
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
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.put
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationApiIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc
    @Autowired private lateinit var objectMapper: ObjectMapper
    @Autowired private lateinit var authService: AuthService
    @Autowired private lateinit var jwtService: JwtService
    @Autowired private lateinit var notificationService: NotificationService
    @Autowired private lateinit var notificationLogRepository: NotificationLogRepository

    @Test
    fun registeringATokenAndChangingRemindersPlansFuturePushes() {
        val tokens = authService.register(RegisterRequest("push-${UUID.randomUUID()}@sen.test", "password123"))
        val userId = jwtService.userIdFromAccessToken(tokens.accessToken)
        val before = notificationLogRepository.count()

        mockMvc.put("/api/v1/devices/push-token") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(
                mapOf("platform" to "ios", "token" to "ExponentPushToken[test]", "notificationsEnabled" to true),
            )
        }.andExpect { status { isOk() } }

        assertTrue(notificationLogRepository.count() > before)

        val planned = notificationLogRepository.findAll().first { it.dedupeKey.startsWith("$userId|") }
        planned.status = "FAILED"
        notificationLogRepository.saveAndFlush(planned)
        notificationService.reschedule(userId)
        assertEquals("PENDING", notificationLogRepository.findByDedupeKey(planned.dedupeKey).orElseThrow().status)
    }

    @Test
    fun changingLocaleRewritesPendingReminderCopy() {
        val tokens = authService.register(RegisterRequest("push-locale-${UUID.randomUUID()}@sen.test", "password123"))
        mockMvc.put("/api/v1/devices/push-token") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(
                mapOf("platform" to "ios", "token" to "ExpoPushToken[locale]", "notificationsEnabled" to true),
            )
        }.andExpect { status { isOk() } }

        mockMvc.patch("/api/v1/me") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("locale" to "en-US"))
        }.andExpect { status { isOk() } }

        val bodies = notificationLogRepository.findAll().map { it.body }
        assertTrue(bodies.any { it.contains("remember to fast") })
    }
}
