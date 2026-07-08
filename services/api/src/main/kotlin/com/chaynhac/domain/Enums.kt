package com.chaynhac.domain

/** Supported sign-in methods linked to a [UserEntity]. */
enum class AuthProvider {
    PASSWORD,
    APPLE,
    GOOGLE,
}

/** Built-in fasting schedules; [CUSTOM] requires explicit lunar day list. */
enum class FastingPreset {
    MUNG_1,
    DAY_15,
    MUNG_1_AND_15,
    CUSTOM,
}

enum class FastingRuleType {
    LUNAR_DAY,
    WEEKDAY,
}

/** Reminder delivery windows relative to a fasting day. */
enum class ReminderSlotKey {
    EVE_BEFORE,
    MORNING,
    FOLLOWUP,
}
