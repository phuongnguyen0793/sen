package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.fasting.FastingProfileResponse
import com.chaynhac.fasting.FastingService
import com.chaynhac.fasting.UpdateFastingProfileRequest
import com.chaynhac.fasting.UpdateRemindersRequest
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

/** Manages per-user fasting presets, rules, and reminder preferences. */
@RestController
@RequestMapping("/api/v1/fasting")
class FastingController(
    private val fastingService: FastingService,
) {
    @GetMapping("/profile")
    fun getProfile(): FastingProfileResponse = fastingService.getProfile(currentUser().id)

    @PutMapping("/profile")
    fun updateProfile(@RequestBody request: UpdateFastingProfileRequest): FastingProfileResponse =
        fastingService.updateProfile(currentUser().id, request)

    @PutMapping("/reminders")
    fun updateReminders(@RequestBody request: UpdateRemindersRequest): FastingProfileResponse =
        fastingService.updateReminders(currentUser().id, request)
}
