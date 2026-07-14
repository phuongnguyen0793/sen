'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fetchMonth, type MonthCalendar } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function clampYear(year: number) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, year));
}

function isValidYear(year: number) {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR;
}

/** Monday-first blank cells before the 1st of the month. */
function leadingEmptyCount(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay(); // 0 = Sun
  return (weekday + 6) % 7;
}

export default function CalendarPage() {
  const { messages } = useI18n();
  const { isReady, isAuthenticated, getAccessToken } = useRequireAuth();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [yearDraft, setYearDraft] = useState(String(now.getFullYear()));
  const [yearError, setYearError] = useState<string | null>(null);
  const [data, setData] = useState<MonthCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setYearDraft(String(year));
    setYearError(null);
  }, [year]);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (!isValidYear(year) || month < 1 || month > 12) return;
    const token = getAccessToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMonth(token, year, month)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : messages.common.error);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, getAccessToken, year, month, messages.common.error]);

  function goToMonth(nextYear: number, nextMonth: number) {
    const shifted =
      nextMonth < 1 || nextMonth > 12 ? shiftMonth(nextYear, nextMonth, 0) : { year: nextYear, month: nextMonth };
    const clampedYear = clampYear(shifted.year);
    if (!isValidYear(clampedYear)) {
      setYearError(
        messages.calendar.invalidYear.replace('{min}', String(MIN_YEAR)).replace('{max}', String(MAX_YEAR)),
      );
      return;
    }
    setYear(clampedYear);
    setMonth(shifted.month);
  }

  function onPrev() {
    const next = shiftMonth(year, month, -1);
    goToMonth(next.year, next.month);
  }

  function onNext() {
    const next = shiftMonth(year, month, 1);
    goToMonth(next.year, next.month);
  }

  function onMonthChange(value: number) {
    if (value < 1 || value > 12) return;
    goToMonth(year, value);
  }

  function commitYearDraft() {
    const parsed = Number(yearDraft);
    if (!isValidYear(parsed)) {
      setYearError(
        messages.calendar.invalidYear.replace('{min}', String(MIN_YEAR)).replace('{max}', String(MAX_YEAR)),
      );
      setYearDraft(String(year));
      return;
    }
    setYearError(null);
    setYear(parsed);
  }

  function jumpToThisMonth() {
    const today = new Date();
    goToMonth(today.getFullYear(), today.getMonth() + 1);
  }

  if (!isReady || !isAuthenticated) {
    return <p className="skeleton">{messages.common.loading}</p>;
  }

  const blanks = leadingEmptyCount(year, month);
  const fastingDays = data?.days.filter((d) => d.isFasting) ?? [];
  const canGoPrev = year > MIN_YEAR || month > 1;
  const canGoNext = year < MAX_YEAR || month < 12;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <section className="fade-up">
      <h1 className="page-title">{messages.calendar.title}</h1>

      <div className="toolbar">
        <button type="button" className="icon-btn" onClick={onPrev} disabled={!canGoPrev} aria-label={messages.calendar.prevMonth}>
          ⟨
        </button>

        <div className="field">
          <label htmlFor="cal-month">{messages.calendar.monthLabel}</label>
          <select
            id="cal-month"
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {messages.calendar.months.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cal-year">{messages.calendar.yearLabel}</label>
          <input
            id="cal-year"
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={yearDraft}
            onChange={(e) => setYearDraft(e.target.value)}
            onBlur={commitYearDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            style={{ width: '6.5rem' }}
          />
        </div>

        <button type="button" className="icon-btn" onClick={onNext} disabled={!canGoNext} aria-label={messages.calendar.nextMonth}>
          ⟩
        </button>

        <button type="button" className="icon-btn" onClick={jumpToThisMonth} disabled={isCurrentMonth}>
          {messages.calendar.jumpToday}
        </button>
      </div>

      {yearError ? <p className="error">{yearError}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      <div className="cal-grid" aria-busy={loading}>
        {messages.calendar.weekdays.map((day) => (
          <div key={day} className="cal-weekday">
            {day}
          </div>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`empty-${i}`} className="cal-cell empty" aria-hidden />
        ))}
        {(data?.days ?? []).map((day) => {
          const solarDay = Number(day.solarDate.slice(-2));
          return (
            <div
              key={day.solarDate}
              className={`cal-cell${day.isFasting ? ' fasting' : ''}${day.isToday ? ' today' : ''}`}
            >
              <span className="cal-solar">{solarDay}</span>
              <span className="cal-lunar">
                {day.lunar.day}/{day.lunar.month}
              </span>
              {day.isFasting ? <span className="cal-dot" aria-hidden /> : null}
            </div>
          );
        })}
      </div>

      {loading && !data ? <p className="skeleton">{messages.common.loading}</p> : null}

      <div className="legend">
        <span className="legend-item">
          <span className="legend-swatch fasting" />
          {messages.calendar.legendFasting}
        </span>
        <span className="legend-item">
          <span className="legend-swatch today" />
          {messages.calendar.legendToday}
        </span>
      </div>

      <h2 className="section-title">{messages.calendar.fastingDaysHeading}</h2>
      {data && fastingDays.length === 0 ? (
        <p className="muted">{messages.calendar.noFastingDays}</p>
      ) : (
        <ul className="fasting-list">
          {fastingDays.map((d) => (
            <li key={d.solarDate} className="card fasting">
              {d.solarDate} — {messages.calendar.lunar} {d.lunar.day}/{d.lunar.month}
              {d.isToday ? ` ${messages.calendar.today}` : ''}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
