package com.chaynhac.api

import com.chaynhac.auth.AuthService
import com.chaynhac.auth.LoginRequest
import com.chaynhac.auth.OAuthRequest
import com.chaynhac.auth.RefreshRequest
import com.chaynhac.auth.RegisterRequest
import com.chaynhac.auth.TokenPairResponse
import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/** Public authentication endpoints under `/api/v1/auth`. */
@RestController
@RequestMapping("/api/v1/auth")
class AuthController(
    private val authService: AuthService,
) {
    /** Registers a new email/password account and returns access + refresh tokens. */
    @PostMapping("/register")
    fun register(@Valid @RequestBody request: RegisterRequest): TokenPairResponse = authService.register(request)

    /** Authenticates with email and password. */
    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): TokenPairResponse = authService.login(request)

    /** Rotates tokens using a valid refresh token (one-time use). */
    @PostMapping("/refresh")
    fun refresh(@RequestBody request: RefreshRequest): TokenPairResponse = authService.refresh(request)

    /** Revokes the given refresh token. */
    @PostMapping("/logout")
    fun logout(@RequestBody request: RefreshRequest) {
        authService.logout(request)
    }

    /** Placeholder for future Apple/Google sign-in; returns 501 in MVP. */
    @PostMapping("/oauth/{provider}")
    fun oauth(
        @PathVariable provider: String,
        @RequestBody request: OAuthRequest,
    ): TokenPairResponse {
        authService.oauthNotImplemented(provider)
    }
}
