'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fetchToday, type TodayStatus } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function AppHomePage() {
  const { messages } = useI18n();
  const { isReady, isAuthenticated, getAccessToken } = useRequireAuth();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const token = getAccessToken();
    if (!token) return;
    fetchToday(token)
      .then(setToday)
      .catch((e) => setError(e instanceof Error ? e.message : messages.common.error));
  }, [isReady, isAuthenticated, getAccessToken, messages.common.error]);

  if (!isReady || !isAuthenticated) {
    return <p>{messages.common.loading}</p>;
  }

  return (
    <section>
      <h1>{messages.today.title}</h1>
      {error ? <p className="error">{error}</p> : null}
      {today ? (
        <div className={`card${today.isFasting ? ' fasting' : ''}`}>
          <p>
            <strong>{today.solarDate}</strong>
          </p>
          <p>
            {messages.today.lunar} {today.lunar.day}/{today.lunar.month}
            {today.lunar.leapMonth ? ` ${messages.today.leapMonth}` : ''}
          </p>
          <p>{today.isFasting ? messages.today.fasting : messages.today.notFasting}</p>
        </div>
      ) : (
        <p>{messages.common.loading}</p>
      )}
    </section>
  );
}
