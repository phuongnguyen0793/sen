'use client';

import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function HomePage() {
  const { messages } = useI18n();

  return (
    <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <LanguageSwitcher />
      </div>
      <h1 style={{ fontSize: '3rem', color: 'var(--green)', marginBottom: '0.5rem' }}>Sen</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 2rem' }}>
        {messages.landing.tagline}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/login" className="btn">
          {messages.landing.signIn}
        </Link>
        <Link href="/app" className="btn" style={{ background: '#40916c' }}>
          {messages.landing.openWebApp}
        </Link>
      </div>
      <p style={{ marginTop: '3rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        {messages.landing.footer}
      </p>
    </main>
  );
}
