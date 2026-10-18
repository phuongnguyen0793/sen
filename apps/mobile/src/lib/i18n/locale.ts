import type { Locale } from './types';

/** Server stores BCP 47 tags; the app uses the short catalog key. */
export function toServerLocale(locale: Locale): string {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

export function fromServerLocale(value: string | null | undefined): Locale {
  return value?.toLowerCase().startsWith('vi') ? 'vi' : 'en';
}
