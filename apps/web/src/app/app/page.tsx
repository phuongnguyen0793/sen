'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LotusMark } from '@/components/LotusMark';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  fetchFastingProfile,
  fetchMonth,
  fetchToday,
  type FastingProfile,
  type MonthCalendar,
  type TodayStatus,
} from '@/lib/api';
import { formatClock, formatLongDate, formatMonthYear, formatWeekday, lunarPhrase, parseIsoDate } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

type CalendarDay = MonthCalendar['days'][number];

export default function AppHomePage() {
  const { locale, messages } = useI18n();
  const { isReady, isAuthenticated, getAccessToken } = useRequireAuth();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [currentMonth, setCurrentMonth] = useState<MonthCalendar | null>(null);
  const [nextMonth, setNextMonth] = useState<MonthCalendar | null>(null);
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const following = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

    setError(null);
    fetchToday(token)
      .then((result) => {
        if (!cancelled) setToday(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : messages.common.error);
      });

    Promise.allSettled([
      fetchMonth(token, year, month),
      fetchMonth(token, following.year, following.month),
      fetchFastingProfile(token),
    ]).then(([current, upcoming, fasting]) => {
      if (cancelled) return;
      if (current.status === 'fulfilled') setCurrentMonth(current.value);
      if (upcoming.status === 'fulfilled') setNextMonth(upcoming.value);
      if (fasting.status === 'fulfilled') setProfile(fasting.value);
      setContextReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, getAccessToken, messages.common.error]);

  const nextFasting = useMemo(() => {
    if (!today) return null;
    const later = (day: CalendarDay) => day.isFasting && day.solarDate > today.solarDate;
    return currentMonth?.days.find(later) ?? nextMonth?.days.find(later) ?? null;
  }, [today, currentMonth, nextMonth]);

  const remaining = useMemo(() => {
    if (!today || !currentMonth) return [];
    return currentMonth.days.filter((day) => day.isFasting && day.solarDate >= today.solarDate);
  }, [today, currentMonth]);

  const enabledReminders = profile?.reminders.filter((row) => row.enabled) ?? [];

  if (!isReady || !isAuthenticated) {
    return <p className="skeleton">{messages.common.loading}</p>;
  }

  const countLabel =
    remaining.length === 1
      ? messages.today.monthCountOne
      : messages.today.monthCountMany.replace('{count}', String(remaining.length));

  return (
    <section className="fade-up today-page">
      <h1 className="page-title">{messages.today.title}</h1>
      {error ? <p className="error">{error}</p> : null}
      {today ? (
        <div className="today-layout">
          <div
            className={`today-hero${today.isFasting ? ' fasting' : ''} fade-up-delay`}
            aria-live="polite"
          >
            <p className="today-kicker">{formatWeekday(today.solarDate, locale)}</p>
            <div className="today-dateblock">
              <p className="today-daynum">{parseIsoDate(today.solarDate).getDate()}</p>
              <p className="today-monthline">{formatMonthYear(today.solarDate, locale)}</p>
            </div>
            <p className="lunar-chip">{lunarPhrase(today.lunar, locale)}</p>
            <p className="today-status">
              {today.isFasting ? <LotusMark size="sm" className="today-status-mark" /> : null}
              <span>{today.isFasting ? messages.today.fasting : messages.today.notFasting}</span>
            </p>
          </div>

          <aside className="today-aside">
            <article className="card aside-card">
              <p className="aside-kicker">{messages.today.nextHeading}</p>
              {nextFasting ? (
                <>
                  <p className="aside-title">{formatLongDate(nextFasting.solarDate, locale)}</p>
                  <p className="aside-meta">{lunarPhrase(nextFasting.lunar, locale)}</p>
                </>
              ) : contextReady ? (
                <p className="aside-meta">{messages.today.nextNone}</p>
              ) : (
                <p className="skeleton">{messages.common.loading}</p>
              )}
            </article>

            {remaining.length > 0 ? (
              <article className="card aside-card">
                <p className="aside-kicker">{messages.today.monthHeading}</p>
                <p className="aside-title">{countLabel}</p>
                <p className="aside-days">
                  {remaining.map((day) => (
                    <span key={day.solarDate}>{parseIsoDate(day.solarDate).getDate()}</span>
                  ))}
                </p>
              </article>
            ) : null}

            <article className="card aside-card">
              <div className="aside-head">
                <p className="aside-kicker">{messages.today.remindersHeading}</p>
                <Link href="/app/reminders" className="aside-link">
                  {messages.today.openReminders}
                </Link>
              </div>
              {enabledReminders.length > 0 ? (
                <ul className="aside-reminders">
                  {enabledReminders.map((row) => {
                    const slotKey = row.slotKey as keyof typeof messages.reminders.slots;
                    const label = messages.reminders.slots[slotKey] ?? row.slotKey;
                    return (
                      <li key={row.slotKey}>
                        <span>{label}</span>
                        <strong>{formatClock(row.localTime)}</strong>
                      </li>
                    );
                  })}
                </ul>
              ) : contextReady ? (
                <p className="aside-meta">{messages.today.remindersNone}</p>
              ) : (
                <p className="skeleton">{messages.common.loading}</p>
              )}
            </article>
          </aside>
        </div>
      ) : (
        <p className="skeleton">{messages.common.loading}</p>
      )}
    </section>
  );
}
