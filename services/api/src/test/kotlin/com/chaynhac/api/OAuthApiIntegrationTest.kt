package com.chaynhac.api

import com.fasterxml.jackson.databind.ObjectMapper
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
