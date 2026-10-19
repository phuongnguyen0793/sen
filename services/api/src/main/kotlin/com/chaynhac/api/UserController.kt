package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.notification.NotificationService
import com.chaynhac.user.UpdateUserRequest
import com.chaynhac.user.UserProfileResponse
import com.chaynhac.user.UserService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/** Current-user profile operations under `/api/v1/me`. */
@RestController
@RequestMapping("/api/v1")
class UserController(
    private val userService: UserService,
    private val notificationService: NotificationService,
) {
    @GetMapping("/me")
    fun me(): UserProfileResponse = userService.getProfile(currentUser().id)

    @PatchMapping("/me")
    fun updateMe(@RequestBody request: UpdateUserRequest): UserProfileResponse {
        val updated = userService.updateProfile(currentUser().id, request)
        if (request.timezone != null || request.locale != null) {
            notificationService.reschedule(currentUser().id)
        }
        return updated
    }

    /** Soft-deletes the account and anonymizes stored PII. */
    @DeleteMapping("/me")
    fun deleteMe() {
        userService.deleteAccount(currentUser().id)
    }
}
