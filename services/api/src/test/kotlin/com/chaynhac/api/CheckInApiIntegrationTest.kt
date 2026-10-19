package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.JwtService
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.calendar.VietnameseLunarCalendar
import com.chaynhac.fasting.FastingService
import com.fasterxml.jackson.databind.ObjectMapper
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.put
import java.time.LocalDate
import java.time.ZoneId
import java.util.UUID

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckInApiIntegrationTest {
    @Autowired private lateinit var mockMvc: MockMvc

    @Autowired private lateinit var objectMapper: ObjectMapper

    @Autowired private lateinit var authService: AuthService

    @Autowired private lateinit var jwtService: JwtService

    @Autowired private lateinit var fastingService: FastingService

    @Test
    fun doneCheckInCountsTowardStreakAndFutureDatesAreRejected() {
        val tokens = authService.register(RegisterRequest("check-${UUID.randomUUID()}@sen.test", "password123"))
        val userId = jwtService.userIdFromAccessToken(tokens.accessToken)
        val lunarDays = fastingService.getProfile(userId).rules.mapNotNull { it.lunarDay }.toSet()
        val today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
        var fastingDay = today
        while (fastingDay.isAfter(today.minusDays(40))) {
            val lunar = VietnameseLunarCalendar.fromSolar(fastingDay.year, fastingDay.monthValue, fastingDay.dayOfMonth)
            if (VietnameseLunarCalendar.isFastingDay(lunar, lunarDays)) break
            fastingDay = fastingDay.minusDays(1)
        }

        mockMvc.put("/api/v1/check-ins/$fastingDay") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("status" to "DONE"))
        }.andExpect {
            status { isOk() }
            jsonPath("$.status") { value("DONE") }
        }

        mockMvc.get("/api/v1/stats/streak") {
            header("Authorization", "Bearer ${tokens.accessToken}")
        }.andExpect {
            status { isOk() }
            jsonPath("$.current") { value(1) }
            jsonPath("$.best") { value(1) }
        }

        mockMvc.put("/api/v1/check-ins/${today.plusDays(3)}") {
            header("Authorization", "Bearer ${tokens.accessToken}")
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(mapOf("status" to "DONE"))
        }.andExpect {
            status { isBadRequest() }
        }
    }
}
