'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAuth } from '@/lib/AuthProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function HomePage() {
  const { messages } = useI18n();
  const { isReady, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <div className="landing">
      <div className="landing-top fade-up">
        <LanguageSwitcher />
        {isReady && isAuthenticated ? (
          <button type="button" className="link-quiet" onClick={onSignOut}>
            {messages.common.signOut}
          </button>
        ) : null}
      </div>

      <div className="landing-hero">
        <div className="landing-stage">
          <div className="moon-rings" aria-hidden />
          <div className="moon" aria-hidden />
          <div className="landing-copy">
            <h1 className="brand-mark fade-up">Sen</h1>
            <p className="landing-tagline fade-up-delay">{messages.landing.tagline}</p>
            <div className="landing-ctas fade-up-delay-2">
              {!isReady ? null : isAuthenticated ? (
                <Link href="/app" className="btn">
                  {messages.landing.openApp}
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn">
                    {messages.landing.signIn}
                  </Link>
                  <Link href="/login" className="btn btn-ghost">
                    {messages.landing.openWebApp}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="landing-footer fade-up-delay-2">{messages.landing.footer}</p>
    </div>
  );
}
