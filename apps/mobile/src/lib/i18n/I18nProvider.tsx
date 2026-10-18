import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { en, type Messages } from './messages/en';
import { vi } from './messages/vi';
import { detectDeviceLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from './types';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Applies the profile locale once. Later calls are ignored so a remount cannot undo a switch. */
  adoptProfileLocale: (locale: Locale) => void;
  /** Marks the profile locale as already applied, before a user-chosen switch is saved. */
  lockProfileLocale: () => void;
  messages: Messages;
  ready: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const catalogs: Record<Locale, Messages> = { en, vi };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(LOCALE_STORAGE_KEY)
      .then((stored) => {
        if (!active) return;
        setLocaleState(isLocale(stored) ? stored : detectDeviceLocale());
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const localeRef = useRef(locale);
  localeRef.current = locale;
  const profileLocaleLocked = useRef(false);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    SecureStore.setItemAsync(LOCALE_STORAGE_KEY, next).catch(() => undefined);
  };

  const adoptProfileLocale = (next: Locale) => {
    if (profileLocaleLocked.current) return;
    profileLocaleLocked.current = true;
    if (next !== localeRef.current) setLocale(next);
  };

  const lockProfileLocale = () => {
    profileLocaleLocked.current = true;
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      adoptProfileLocale,
      lockProfileLocale,
      messages: catalogs[locale],
      ready,
    }),
    [locale, ready],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
