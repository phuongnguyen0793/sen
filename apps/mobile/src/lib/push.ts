import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import type { createApiClient } from './api';

type Api = ReturnType<typeof createApiClient>;

const PUSH_TOKEN_KEY = 'sen.pushToken';

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
    if (status !== 'unavailable') await disableThisDevice(api);
    return status;
  }
  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  try {
    const token = await Notifications.getExpoPushTokenAsync();
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token.data);
    await api.registerPushToken({ platform, token: token.data, notificationsEnabled: true });
    usingLocalFallback = false;
    await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
    return 'granted' as const;
  } catch {
    usingLocalFallback = true;
    await disableThisDevice(api);
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
    await disableThisDevice(api);
    return asked.status;
  }
  return syncGrantedPushToken(api);
}

async function disableThisDevice(api: Api) {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY).catch(() => null);
  if (!token) return;
  const platform = Platform.OS === 'android' ? 'android' : 'ios';
  await api.registerPushToken({ platform, token, notificationsEnabled: false }).catch(() => undefined);
}

async function scheduleLocalFallback(api: Api) {
  const [upcoming, profile, me] = await Promise.all([
    api.upcoming(14),
    api.fastingProfile(),
    api.me().catch(() => null),
  ]);
  const timeZone = me?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const enabled = profile.reminders.filter((row) => row.enabled);
  for (const day of upcoming.days.slice(0, 8)) {
    for (const reminder of enabled) {
      const [hour, minute] = reminder.localTime.split(':').map(Number);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;
      const when = zonedDateTime(addIsoDays(day.solarDate, reminder.offsetDays), hour, minute, timeZone);
      if (when.getTime() <= Date.now()) continue;
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Sen', body: day.solarDate, data: { fastingDate: day.solarDate } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  }
}

function addIsoDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0');
  const d = String(utc.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Wall-clock time in [timeZone], as an absolute instant. */
function zonedDateTime(isoDate: string, hour: number, minute: number, timeZone: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
        .formatToParts(new Date(utcGuess))
        .map((part) => [part.type, part.value]),
    );
    let hourPart = Number(parts.hour);
    let dayPart = Number(parts.day);
    if (hourPart === 24) {
      hourPart = 0;
      dayPart += 1;
    }
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      dayPart,
      hourPart,
      Number(parts.minute),
      Number(parts.second),
    );
    return new Date(utcGuess - (asUtc - utcGuess));
  } catch {
    const when = new Date(`${isoDate}T00:00:00`);
    when.setHours(hour, minute, 0, 0);
    return when;
  }
}
