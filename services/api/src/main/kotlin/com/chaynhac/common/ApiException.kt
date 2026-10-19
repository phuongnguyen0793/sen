package com.chaynhac.common

import com.fasterxml.jackson.annotation.JsonInclude
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import java.util.UUID

/**
 * Application-level error with stable [code] for clients.
 * Mapped to JSON `{ code, message }` by [GlobalExceptionHandler].
 */
class ApiException(
    val code: String,
    override val message: String,
    val status: HttpStatus = HttpStatus.BAD_REQUEST,
    val fallbackRecipeIds: List<UUID>? = null,
) : RuntimeException(message)

data class ErrorResponse(
    val code: String,
    val message: String,
    @JsonInclude(JsonInclude.Include.NON_NULL)
    val fallbackRecipeIds: List<UUID>? = null,
)

/** Converts [ApiException] and uncaught errors into consistent JSON error bodies. */
@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(ApiException::class)
    fun handleApiException(ex: ApiException): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(ex.status).body(ErrorResponse(ex.code, ex.message, ex.fallbackRecipeIds))

    @ExceptionHandler(Exception::class)
    fun handleGeneric(ex: Exception): ResponseEntity<ErrorResponse> =
        ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse("INTERNAL_ERROR", ex.message ?: "Unexpected error"))
}
