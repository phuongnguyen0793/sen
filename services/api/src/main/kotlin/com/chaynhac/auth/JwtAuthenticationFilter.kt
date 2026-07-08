package com.chaynhac.auth

import com.chaynhac.user.UserService
import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.UUID

/** Authenticated principal attached to the Spring Security context after JWT validation. */
data class AuthenticatedUser(
    val id: UUID,
    val email: String,
)

/**
 * Parses `Authorization: Bearer` headers and populates [SecurityContextHolder].
 * Invalid tokens are ignored so public routes still work.
 */
@Component
class JwtAuthenticationFilter(
    private val jwtService: JwtService,
    private val userService: UserService,
) : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain,
    ) {
        val header = request.getHeader("Authorization")
        if (header != null && header.startsWith("Bearer ")) {
            val token = header.removePrefix("Bearer ").trim()
            try {
                val userId = jwtService.userIdFromAccessToken(token)
                val user = userService.findActiveUser(userId)
                val principal = AuthenticatedUser(id = user.id, email = user.email)
                val auth =
                    UsernamePasswordAuthenticationToken(principal, null, emptyList()).apply {
                        details = WebAuthenticationDetailsSource().buildDetails(request)
                    }
                SecurityContextHolder.getContext().authentication = auth
            } catch (_: Exception) {
                SecurityContextHolder.clearContext()
            }
        }
        filterChain.doFilter(request, response)
    }
}

/** Returns the current user or throws [com.chaynhac.common.ApiException] with 401. */
fun currentUser(): AuthenticatedUser {
    val auth =
        SecurityContextHolder.getContext().authentication?.principal as? AuthenticatedUser
            ?: throw com.chaynhac.common.ApiException(
                "UNAUTHORIZED",
                "Authentication required",
                org.springframework.http.HttpStatus.UNAUTHORIZED,
            )
    return auth
}
