'use client';

import { useEffect, useMemo, useState } from 'react';
import { LotusMark } from '@/components/LotusMark';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fetchFastingProfile, fetchMonth, type FastingProfile, type MonthCalendar } from '@/lib/api';
import { formatClock, formatLongDate, lunarCell, lunarPhrase, parseIsoDate } from '@/lib/format';
import { useRequireAuth } from '@/lib/useRequireAuth';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

type CalendarDay = MonthCalendar['days'][number];

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
  const { locale, messages } = useI18n();
  const { isReady, isAuthenticated, getAccessToken } = useRequireAuth();
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [yearDraft, setYearDraft] = useState(String(now.getFullYear()));
  const [yearError, setYearError] = useState<string | null>(null);
  const [data, setData] = useState<MonthCalendar | null>(null);
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    fetchFastingProfile(token)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, getAccessToken]);

  useEffect(() => {
    if (!data) return;
    setSelectedDate((current) => {
      if (current && data.days.some((day) => day.solarDate === current)) return current;
      const today = data.days.find((day) => day.isToday);
      if (today) return today.solarDate;
      const fasting = data.days.find((day) => day.isFasting);
      return fasting?.solarDate ?? data.days[0]?.solarDate ?? null;
    });
  }, [data]);

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
  const fastingDays = data?.days.filter((day) => day.isFasting) ?? [];
  const selected = data?.days.find((day) => day.solarDate === selectedDate) ?? null;
  const canGoPrev = year > MIN_YEAR || month > 1;
  const canGoNext = year < MAX_YEAR || month < 12;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const enabledReminders = profile?.reminders.filter((row) => row.enabled) ?? [];

  return (
    <section className="fade-up">
      <h1 className="page-title">{messages.calendar.title}</h1>

      <div className="cal-nav">
        <button type="button" className="icon-btn" onClick={onPrev} disabled={!canGoPrev} aria-label={messages.calendar.prevMonth}>
          ⟨
        </button>

        <div className="cal-nav-title">
          <label className="sr-only" htmlFor="cal-month">
            {messages.calendar.monthLabel}
          </label>
          <select
            id="cal-month"
            className="cal-month-select"
            value={month}
            onChange={(e) => onMonthChange(Number(e.target.value))}
          >
            {messages.calendar.months.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="cal-year">
            {messages.calendar.yearLabel}
          </label>
          <input
            id="cal-year"
            className="cal-year-input"
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={yearDraft}
            onChange={(e) => setYearDraft(e.target.value)}
            onBlur={commitYearDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </div>

        <button type="button" className="icon-btn" onClick={onNext} disabled={!canGoNext} aria-label={messages.calendar.nextMonth}>
          ⟩
        </button>

        <button type="button" className="cal-jump" onClick={jumpToThisMonth} disabled={isCurrentMonth}>
          {messages.calendar.jumpToday}
        </button>
      </div>

      {yearError ? <p className="error">{yearError}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {selected ? <DayDetail day={selected} locale={locale} messages={messages} reminders={enabledReminders} /> : null}

      <div className="cal-summary">
        <span>
          {fastingDays.length === 0
            ? messages.calendar.noFastingDays
            : `${messages.calendar.fastingDaysHeading} · ${fastingDays.length}`}
        </span>
        {fastingDays.length > 0 ? (
          <span className="cal-summary-days">
            {fastingDays.map((day) => {
              const solarDay = parseIsoDate(day.solarDate).getDate();
              const active = day.solarDate === selectedDate;
              return (
                <button
                  key={day.solarDate}
                  type="button"
                  className={`cal-summary-day${active ? ' active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setSelectedDate(day.solarDate)}
                >
                  {solarDay}
                </button>
              );
            })}
          </span>
        ) : null}
      </div>

      <div className="cal-grid" aria-busy={loading}>
        {messages.calendar.weekdays.map((day, index) => (
          <div key={day} className={`cal-weekday${index === 6 ? ' weekend' : ''}`}>
            {day}
          </div>
        ))}
        {Array.from({ length: blanks }).map((_, i) => (
          <div key={`empty-${i}`} className="cal-cell empty" aria-hidden />
        ))}
        {(data?.days ?? []).map((day, index) => {
          const solarDay = parseIsoDate(day.solarDate).getDate();
          const weekend = (blanks + index) % 7 === 6;
          const labelParts = [
            day.solarDate,
            lunarPhrase(day.lunar, locale),
            day.isFasting ? messages.calendar.legendFasting : null,
            day.isToday ? messages.calendar.legendToday : null,
          ].filter(Boolean);

          return (
            <button
              key={day.solarDate}
              type="button"
              className={`cal-cell${day.isFasting ? ' fasting' : ''}${day.isToday ? ' today' : ''}${weekend ? ' weekend' : ''}${day.solarDate === selectedDate ? ' selected' : ''}`}
              aria-label={labelParts.join(', ')}
              aria-pressed={day.solarDate === selectedDate}
              onClick={() => setSelectedDate(day.solarDate)}
            >
              <span className="cal-solar">{solarDay}</span>
              <span className="cal-lunar">{lunarCell(day.lunar, locale)}</span>
              {day.isFasting ? (
                <span className="cal-lotus">
                  <LotusMark size="dot" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading && !data ? <p className="skeleton">{messages.common.loading}</p> : null}

      <div className="legend">
        <span className="legend-item">
          <LotusMark size="dot" className="legend-lotus" />
          {messages.calendar.legendFasting}
        </span>
        <span className="legend-item">
          <span className="legend-swatch today" />
          {messages.calendar.legendToday}
        </span>
      </div>
    </section>
  );
}

function DayDetail({
  day,
  locale,
  messages,
  reminders,
}: {
  day: CalendarDay;
  locale: 'en' | 'vi';
  messages: ReturnType<typeof useI18n>['messages'];
  reminders: FastingProfile['reminders'];
}) {
  const reminderLine =
    reminders.length === 0
      ? messages.calendar.remindersOff
      : reminders
          .map((row) => {
            const slotKey = row.slotKey as keyof typeof messages.reminders.slots;
            const label = messages.reminders.slots[slotKey] ?? row.slotKey;
            return `${label} ${formatClock(row.localTime)}`;
          })
          .join(' · ');

  return (
    <div className={`cal-detail card${day.isFasting ? ' fasting' : ''}`}>
      <div>
        <p className="cal-detail-date">
          {formatLongDate(day.solarDate, locale)}
          {day.isToday ? <span className="cal-detail-today">{messages.calendar.today}</span> : null}
        </p>
        <p className="cal-detail-lunar">{lunarPhrase(day.lunar, locale)}</p>
      </div>
      <div className="cal-detail-side">
        <p className={day.isFasting ? 'cal-detail-fasting' : 'cal-detail-plain'}>
          {day.isFasting ? messages.calendar.legendFasting : messages.calendar.notFastingDay}
        </p>
        {day.isFasting ? <p className="cal-detail-reminders">{reminderLine}</p> : null}
      </div>
    </div>
  );
}
