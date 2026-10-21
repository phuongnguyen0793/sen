package com.chaynhac.notification

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

class ExpoPushTokenTest {
    @Test
    fun `accepts current and legacy Expo token shapes`() {
        assertTrue(isExpoPushToken("ExponentPushToken[abc]"))
        assertTrue(isExpoPushToken("ExpoPushToken[abc]"))
        assertTrue(isExpoPushToken("11111111-2222-3333-4444-555555555555"))
        assertFalse(isExpoPushToken("fcm-token"))
    }

    @Test
    fun `a ticket error is not treated as delivered`() {
        val receipt = interpretExpoTickets(
            mapOf("data" to listOf(mapOf("status" to "error", "message" to "MessageRateExceeded"))),
            listOf("ExpoPushToken[abc]"),
        )
        assertFalse(receipt.delivered)
        assertTrue(receipt.retry)
    }

    @Test
    fun `an unregistered device is not retried`() {
        val receipt = interpretExpoTickets(
            mapOf(
                "data" to listOf(
                    mapOf(
                        "status" to "error",
                        "message" to "not registered",
                        "details" to mapOf("error" to "DeviceNotRegistered"),
                    ),
                ),
            ),
            listOf("ExpoPushToken[gone]"),
        )
        assertFalse(receipt.delivered)
        assertFalse(receipt.retry)
        assertEquals(listOf("ExpoPushToken[gone]"), receipt.deadTokens)
    }
}
