'use client';

import { useI18n } from '@/lib/i18n/I18nProvider';
import type { Locale } from '@/lib/i18n/types';

const options: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'EN' },
  { locale: 'vi', label: 'VI' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div style={{ display: 'inline-flex', gap: '0.25rem' }} role="group" aria-label="Language">
      {options.map((option) => (
        <button
          key={option.locale}
          type="button"
          onClick={() => setLocale(option.locale)}
          style={{
            padding: '0.25rem 0.5rem',
            fontSize: '0.85rem',
            fontWeight: locale === option.locale ? 700 : 400,
            background: locale === option.locale ? 'var(--green)' : 'transparent',
            color: locale === option.locale ? '#fff' : 'var(--green)',
            border: '1px solid var(--green)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
