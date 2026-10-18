import type { Locale } from './i18n/types';

type LunarDate = { day: number; month: number; leapMonth: boolean };

export function parseIsoDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatClock(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return value;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function localeTag(locale: Locale) {
  return locale === 'vi' ? 'vi-VN' : 'en-US';
}

function capitalize(value: string, locale: Locale) {
  if (!value) return value;
  return value.charAt(0).toLocaleUpperCase(localeTag(locale)) + value.slice(1);
}

export function formatWeekday(iso: string, locale: Locale) {
  const formatted = new Intl.DateTimeFormat(localeTag(locale), { weekday: 'long' }).format(parseIsoDate(iso));
  return capitalize(formatted, locale);
}

export function formatMonthYear(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(localeTag(locale), {
    month: 'long',
    year: 'numeric',
  }).format(parseIsoDate(iso));
}

export function formatLongDate(iso: string, locale: Locale) {
  const formatted = new Intl.DateTimeFormat(localeTag(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(parseIsoDate(iso));
  return capitalize(formatted, locale);
}

/** Short label for a calendar cell. */
export function lunarCell(lunar: LunarDate, locale: Locale) {
  if (locale === 'vi' && lunar.day === 1) return 'Mùng 1';
  if (locale === 'vi' && lunar.day === 15) return 'Rằm';
  return `${lunar.day}/${lunar.month}`;
}

/** Spoken lunar date. Day 1 and day 15 use the everyday Vietnamese names. */
export function lunarPhrase(lunar: LunarDate, locale: Locale) {
  const leap = lunar.leapMonth ? (locale === 'vi' ? ' (nhuận)' : ' (leap)') : '';
  if (locale === 'vi') {
    if (lunar.day === 1) return `Mùng 1 tháng ${lunar.month}${leap}`;
    if (lunar.day === 15) return `Rằm tháng ${lunar.month}${leap}`;
    return `${lunar.day} tháng ${lunar.month}${leap}`;
  }
  if (lunar.day === 1) return `1st day, month ${lunar.month}${leap}`;
  if (lunar.day === 15) return `Full moon, month ${lunar.month}${leap}`;
  return `Day ${lunar.day}, month ${lunar.month}${leap}`;
}

/** Lunar phrase that says it is lunar, for places where a solar date sits nearby. */
export function lunarLabel(lunar: LunarDate, locale: Locale) {
  const phrase = lunarPhrase(lunar, locale);
  return locale === 'vi' ? `${phrase} âm lịch` : `Lunar: ${phrase}`;
}
