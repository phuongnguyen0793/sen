import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import type { createApiClient } from './api';

type Api = ReturnType<typeof createApiClient>;

let usingLocalFallback = false;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function notificationPermission() {
  if (!Device.isDevice) return 'unavailable' as const;
  const current = await Notifications.getPermissionsAsync();
  return current.status;
}

/** Registers the Expo push token when permission is already granted. Does not prompt. */
export async function syncGrantedPushToken(api: Api) {
  const status = await notificationPermission();
  if (status !== 'granted') {
    if (status !== 'unavailable') await api.updateNotificationStatus(false).catch(() => undefined);
    return status;
  }
  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await api.registerPushToken({ platform, token: token.data, notificationsEnabled: true });
    usingLocalFallback = false;
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    return 'granted' as const;
  } catch {
    usingLocalFallback = true;
    await scheduleLocalFallback(api);
    return 'local' as const;
  }
}

/** Updates on-device reminders after a schedule change when Expo push is unavailable. */
export async function refreshLocalReminders(api: Api) {
  if (!usingLocalFallback) return;
  await scheduleLocalFallback(api);
}

export async function requestNotificationPermission(api: Api) {
  if (!Device.isDevice) return 'unavailable' as const;
  const asked = await Notifications.requestPermissionsAsync();
  if (asked.status !== 'granted') {
    await api.updateNotificationStatus(false).catch(() => undefined);
    return asked.status;
  }
  return syncGrantedPushToken(api);
}

async function scheduleLocalFallback(api: Api) {
  const [upcoming, profile] = await Promise.all([api.upcoming(14), api.fastingProfile()]);
  await Notifications.cancelAllScheduledNotificationsAsync();
  const enabled = profile.reminders.filter((row) => row.enabled);
  for (const day of upcoming.days.slice(0, 8)) {
    for (const reminder of enabled) {
      const [hour, minute] = reminder.localTime.split(':').map(Number);
      const when = new Date(`${day.solarDate}T00:00:00`);
      when.setDate(when.getDate() + reminder.offsetDays);
      when.setHours(hour, minute, 0, 0);
      if (when.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Sen', body: day.solarDate, data: { fastingDate: day.solarDate } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  }
}
