'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchToday, type TodayStatus } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export default function AppHomePage() {
  const router = useRouter();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchToday(token)
      .then(setToday)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi'));
  }, [router]);

  return (
    <section>
      <h1>Hôm nay</h1>
      {error ? <p className="error">{error}</p> : null}
      {today ? (
        <div className={`card${today.isFasting ? ' fasting' : ''}`}>
          <p>
            <strong>{today.solarDate}</strong>
          </p>
          <p>
            Âm {today.lunar.day}/{today.lunar.month}
            {today.lunar.leapMonth ? ' (nhuận)' : ''}
          </p>
          <p>{today.isFasting ? 'Hôm nay là ngày chay' : 'Hôm nay không phải ngày chay'}</p>
        </div>
      ) : (
        <p>Đang tải…</p>
      )}
    </section>
  );
}
