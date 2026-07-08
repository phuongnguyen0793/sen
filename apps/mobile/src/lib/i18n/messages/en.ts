export const en = {
  common: {
    loading: 'Loading…',
    error: 'Something went wrong',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signOut: 'Sign out',
    on: 'on',
    off: 'off',
    at: 'at',
    language: 'Language',
    refresh: 'Refresh',
    signInFailed: 'Sign in failed',
  },
  login: {
    subtitle: 'Lunar fasting companion',
  },
  nav: {
    today: 'Today',
    settings: 'Settings',
  },
  today: {
    title: 'Today',
    lunar: 'Lunar',
    leapMonth: '(leap month)',
    fasting: 'Today is a fasting day',
    notFasting: 'Today is not a fasting day',
    loadError: 'Failed to load data',
  },
  settings: {
    title: 'Schedule & reminders',
    preset: 'Preset',
    slots: {
      EVE_BEFORE: 'Evening before',
      MORNING: 'Morning of',
      FOLLOWUP: 'Follow-up',
    },
  },
} as const;

export type { Messages } from './types';
