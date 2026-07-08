'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, type Messages } from './messages/en';
import { vi } from './messages/vi';
import { detectBrowserLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from './types';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const catalogs: Record<Locale, Messages> = { en, vi };

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    setLocaleState(isLocale(stored) ? stored : detectBrowserLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = locale === 'vi' ? 'vi' : 'en';
    document.title = catalogs[locale].meta.title;
  }, [locale, ready]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      messages: catalogs[locale],
    }),
    [locale],
  );

  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
