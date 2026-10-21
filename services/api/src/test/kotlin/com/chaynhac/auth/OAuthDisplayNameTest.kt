package com.chaynhac.auth

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class OAuthDisplayNameTest {
    @Test
    fun `apple name from the app is used when the token has none`() {
        assertEquals(
            "Nguyễn An",
            oauthDisplayName(null, "Nguyễn An", "abc@privaterelay.appleid.com"),
        )
    }

    @Test
    fun `verified token name wins over the name sent by the app`() {
        assertEquals("Token Name", oauthDisplayName("Token Name", "Client Name", "ada@example.com"))
    }

    @Test
    fun `blank name falls back to the email local part`() {
        assertEquals("ada", oauthDisplayName(null, "  ", "ada@example.com"))
        assertEquals("ada", oauthDisplayName(null, null, "ada@example.com"))
    }

    @Test
    fun `name longer than the profile limit is shortened`() {
        assertEquals("A".repeat(80), oauthDisplayName(null, "A".repeat(100), "ada@example.com"))
    }
}
