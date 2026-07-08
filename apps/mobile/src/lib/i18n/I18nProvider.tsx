import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { en, type Messages } from './messages/en';
import { vi } from './messages/vi';
import { detectDeviceLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from './types';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
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

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    SecureStore.setItemAsync(LOCALE_STORAGE_KEY, next).catch(() => undefined);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
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
