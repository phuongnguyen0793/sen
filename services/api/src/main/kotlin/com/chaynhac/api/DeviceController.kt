package com.chaynhac.api

import com.chaynhac.auth.currentUser
import com.chaynhac.notification.NotificationService
import com.chaynhac.notification.NotificationStatusRequest
import com.chaynhac.notification.PushTokenRequest
import org.springframework.web.bind.annotation.PatchMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/devices")
class DeviceController(
    private val notificationService: NotificationService,
) {
    @PutMapping("/push-token")
    fun register(@RequestBody request: PushTokenRequest) {
        notificationService.registerToken(currentUser().id, request)
    }

    @PatchMapping("/notification-status")
    fun status(@RequestBody request: NotificationStatusRequest) {
        notificationService.updateStatus(currentUser().id, request.notificationsEnabled)
    }
}
