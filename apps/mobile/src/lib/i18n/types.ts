export type Locale = 'en' | 'vi';

export const LOCALE_STORAGE_KEY = 'sen.locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'vi';
}

export function detectDeviceLocale(): Locale {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() ?? 'en';
  return locale.startsWith('vi') ? 'vi' : 'en';
}
