package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.checkin.CheckInResponse
import com.chaynhac.checkin.CheckInService
import com.chaynhac.checkin.StreakResponse
import com.chaynhac.checkin.UpsertCheckInRequest
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.LocalDate

@RestController
@RequestMapping("/api/v1")
class CheckInController(
    private val checkInService: CheckInService,
) {
    @PutMapping("/check-ins/{localDate}")
    fun upsert(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) localDate: LocalDate,
        @RequestBody request: UpsertCheckInRequest,
    ): CheckInResponse = checkInService.upsert(currentUser().id, localDate, request)

    @GetMapping("/check-ins")
    fun range(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate,
    ): List<CheckInResponse> = checkInService.range(currentUser().id, from, to)

    @GetMapping("/stats/streak")
    fun streak(): StreakResponse = checkInService.streak(currentUser().id)
}
