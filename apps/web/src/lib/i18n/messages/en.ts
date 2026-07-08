export const en = {
  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    requestFailed: 'Request failed',
    email: 'Email',
    password: 'Password',
    passwordHint: 'Password (8+ characters)',
    pleaseWait: 'Please wait…',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    on: 'on',
    off: 'off',
    at: 'at',
    language: 'Language',
    refresh: 'Refresh',
  },
  landing: {
    tagline:
      'Never miss lunar fasting days — first day of the month, full moon, and the days you choose.',
    signIn: 'Sign in',
    openWebApp: 'Open web app',
    footer: 'Lunar Fasting Companion — built for the Vietnamese calendar.',
  },
  login: {
    titleSignIn: 'Sign in',
    titleRegister: 'Create account',
    toggleToRegister: "Don't have an account? Sign up",
    toggleToSignIn: 'Already have an account? Sign in',
  },
  nav: {
    home: 'Home',
    today: 'Today',
    calendar: 'Calendar',
    reminders: 'Reminders',
  },
  today: {
    title: 'Today',
    lunar: 'Lunar',
    leapMonth: '(leap month)',
    fasting: 'Today is a fasting day',
    notFasting: 'Today is not a fasting day',
    loadError: 'Failed to load data',
  },
  calendar: {
    title: 'Monthly calendar',
    lunar: 'lunar',
    today: '(today)',
  },
  reminders: {
    title: 'Reminders & fasting schedule',
    currentPreset: 'Current preset',
    reminderTimes: 'Reminder times',
    presets: {
      MUNG_1: 'First day only (day 1)',
      DAY_15: 'Full moon only (day 15)',
      MUNG_1_AND_15: 'First day & full moon',
    },
    slots: {
      EVE_BEFORE: 'Evening before',
      MORNING: 'Morning of',
      FOLLOWUP: 'Follow-up',
    },
  },
  meta: {
    title: 'Sen — Lunar Fasting Companion',
    description:
      'Never miss lunar fasting days. Reminders for the Vietnamese calendar and vegetarian recipes.',
  },
} as const;

export type { Messages } from './types';
