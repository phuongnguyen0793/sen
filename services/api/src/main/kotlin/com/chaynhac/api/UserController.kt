package com.chaynhac.api

import com.chaynhac.auth.currentUser
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
) {
    @GetMapping("/me")
    fun me(): UserProfileResponse = userService.getProfile(currentUser().id)

    @PatchMapping("/me")
    fun updateMe(@RequestBody request: UpdateUserRequest): UserProfileResponse =
        userService.updateProfile(currentUser().id, request)

    /** Soft-deletes the account and anonymizes stored PII. */
    @DeleteMapping("/me")
    fun deleteMe() {
        userService.deleteAccount(currentUser().id)
    }
}
