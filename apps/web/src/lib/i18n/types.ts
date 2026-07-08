export type Locale = 'en' | 'vi';

export const LOCALE_STORAGE_KEY = 'sen.locale';

export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en' || value === 'vi';
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}
