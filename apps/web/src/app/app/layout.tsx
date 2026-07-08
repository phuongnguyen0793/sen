'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { messages } = useI18n();

  const links = [
    { href: '/app', label: messages.nav.today },
    { href: '/app/calendar', label: messages.nav.calendar },
    { href: '/app/reminders', label: messages.nav.reminders },
  ];

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.25rem', color: 'var(--green)' }}>Sen</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <LanguageSwitcher />
          <Link href="/">{messages.nav.home}</Link>
        </div>
      </header>
      <nav className="nav">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ fontWeight: pathname === l.href ? 700 : 400 }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
