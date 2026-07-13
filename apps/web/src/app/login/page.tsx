'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
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
        mode === 'login'
          ? await login(email, password)
          : await register(email, password);
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
      <main className="container" style={{ maxWidth: 420, paddingTop: '3rem' }}>
        <p>{messages.common.loading}</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: 420, paddingTop: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/">← Sen</Link>
        <LanguageSwitcher />
      </div>
      <h1 style={{ marginTop: '1rem' }}>
        {mode === 'login' ? messages.login.titleSignIn : messages.login.titleRegister}
      </h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <input
          type="email"
          placeholder={messages.common.email}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder={messages.common.passwordHint}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading
            ? messages.common.pleaseWait
            : mode === 'login'
              ? messages.common.signIn
              : messages.common.signUp}
        </button>
      </form>
      <p style={{ marginTop: '1rem' }}>
        <button
          type="button"
          style={{ background: 'transparent', color: 'var(--green)', padding: 0 }}
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? messages.login.toggleToRegister : messages.login.toggleToSignIn}
        </button>
      </p>
    </main>
  );
}
