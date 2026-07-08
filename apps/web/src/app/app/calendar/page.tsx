'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMonth, type MonthCalendar } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export default function CalendarPage() {
  const router = useRouter();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<MonthCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchMonth(token, year, month)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'));
  }, [router, year, month]);

  return (
    <section>
      <h1>Monthly calendar</h1>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="number"
          value={month}
          min={1}
          max={12}
          onChange={(e) => setMonth(Number(e.target.value))}
          style={{ width: 80 }}
        />
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          style={{ width: 100 }}
        />
      </div>
      {error ? <p className="error">{error}</p> : null}
      {data ? (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
          {data.days
            .filter((d) => d.isFasting)
            .map((d) => (
              <li key={d.solarDate} className="card fasting" style={{ padding: '0.75rem' }}>
                {d.solarDate} — lunar {d.lunar.day}/{d.lunar.month}
                {d.isToday ? ' (today)' : ''}
              </li>
            ))}
        </ul>
      ) : (
        <p>Loading…</p>
      )}
    </section>
  );
}
