package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.calendar.CalendarApiService
import com.chaynhac.calendar.MonthCalendarResponse
import com.chaynhac.calendar.TodayStatusResponse
import com.chaynhac.calendar.UpcomingFastingResponse
import com.chaynhac.user.UserService
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.ZoneId

/** Authenticated calendar views resolved in the user's configured timezone. */
@RestController
@RequestMapping("/api/v1/calendar")
class CalendarController(
    private val calendarApiService: CalendarApiService,
    private val userService: UserService,
) {
    /** Returns every day in a solar month with lunar date and fasting flags. */
    @GetMapping("/month")
    fun month(
        @RequestParam year: Int,
        @RequestParam month: Int,
    ): MonthCalendarResponse {
        val zone = zoneForCurrentUser()
        return calendarApiService.month(currentUser().id, year, month, zone)
    }

    /** Returns today's solar/lunar dates and whether the user fasts today. */
    @GetMapping("/today")
    fun today(): TodayStatusResponse = calendarApiService.today(currentUser().id, zoneForCurrentUser())

    /** Lists upcoming fasting days within the next [days] solar days (default 30). */
    @GetMapping("/upcoming")
    fun upcoming(
        @RequestParam(defaultValue = "30") days: Int,
    ): UpcomingFastingResponse = calendarApiService.upcoming(currentUser().id, days, zoneForCurrentUser())

    private fun zoneForCurrentUser(): ZoneId {
        val user = userService.findActiveUser(currentUser().id)
        return ZoneId.of(user.timezone)
    }
}
