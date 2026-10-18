'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LotusMark } from '@/components/LotusMark';
import { useAuth } from '@/lib/AuthProvider';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { login, register } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { messages } = useI18n();
  const { isReady, isAuthenticated, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace('/app');
    }
  }, [isReady, isAuthenticated, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const tokens =
        mode === 'login' ? await login(email, password) : await register(email, password);
      signIn(tokens);
      router.push('/app');
    } catch (err) {
      setError(err instanceof Error ? err.message : messages.common.requestFailed);
    } finally {
      setLoading(false);
    }
  }

  if (!isReady || isAuthenticated) {
    return (
      <div className="auth-shell">
        <p className="skeleton">{messages.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-lang">
        <LanguageSwitcher />
      </div>

      <div className="auth-stage">
        <div className="auth-intro fade-up">
          <Link href="/" className="auth-brand">
            <LotusMark size="lg" />
            Sen
          </Link>
          <p className="auth-lead">{messages.landing.tagline}</p>
        </div>

        <div className="auth-card fade-up-delay">
          <h1 className="auth-title">
            {mode === 'login' ? messages.login.titleSignIn : messages.login.titleRegister}
          </h1>
          <form onSubmit={onSubmit} className="auth-form">
            <label className="sr-only" htmlFor="auth-email">
              {messages.common.email}
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder={messages.common.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <label className="sr-only" htmlFor="auth-password">
              {messages.common.passwordHint}
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder={messages.common.passwordHint}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-describedby={error ? 'auth-error' : undefined}
            />
            {error ? (
              <p id="auth-error" className="error" role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" disabled={loading}>
              {loading
                ? messages.common.pleaseWait
                : mode === 'login'
                  ? messages.common.signIn
                  : messages.common.signUp}
            </button>
          </form>
          <div className="auth-divider" />
          <div className="auth-switch">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? messages.login.titleRegister : messages.login.titleSignIn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
