'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/lib/AuthProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { messages } = useI18n();
  const { isReady, isAuthenticated, signOut } = useAuth();

  const links = [
    { href: '/app', label: messages.nav.today },
    { href: '/app/calendar', label: messages.nav.calendar },
    { href: '/app/reminders', label: messages.nav.reminders },
  ];

  async function onSignOut() {
    await signOut();
    router.replace('/');
  }

  return (
    <div className="app-shell">
      <div className="container">
        <header className="app-header">
          <Link href="/app" className="app-brand">
            Sen
          </Link>
          <div className="app-header-actions">
            <LanguageSwitcher />
            <Link href="/" className="link-quiet">
              {messages.nav.home}
            </Link>
            {isReady && isAuthenticated ? (
              <button type="button" className="link-quiet" onClick={onSignOut}>
                {messages.common.signOut}
              </button>
            ) : null}
          </div>
        </header>
        <nav className="app-nav" aria-label="App">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={pathname === l.href ? 'active' : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
