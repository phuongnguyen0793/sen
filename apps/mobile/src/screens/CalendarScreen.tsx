import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { FastingProfile, MonthCalendar } from '../lib/api';
import { formatClock, formatLongDate, lunarCell, lunarPhrase, parseIsoDate } from '../lib/format';
import { colors, fonts, radius, space } from '../theme';

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

function leadingEmptyCount(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay();
  return (weekday + 6) % 7;
}

export function CalendarScreen() {
  const { api } = useAuth();
  const { locale, messages } = useI18n();
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
    if (!isValidYear(year) || month < 1 || month > 12) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .month(year, month)
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
  }, [api, year, month, messages.common.error]);

  useEffect(() => {
    let cancelled = false;
    api
      .fastingProfile()
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

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
      nextMonth < 1 || nextMonth > 12
        ? shiftMonth(nextYear, nextMonth, 0)
        : { year: nextYear, month: nextMonth };
    const clamped = clampYear(shifted.year);
    if (!isValidYear(clamped)) {
      setYearError(
        messages.calendar.invalidYear.replace('{min}', String(MIN_YEAR)).replace('{max}', String(MAX_YEAR)),
      );
      return;
    }
    setYear(clamped);
    setMonth(shifted.month);
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

  const blanks = leadingEmptyCount(year, month);
  const fastingDays = data?.days.filter((day) => day.isFasting) ?? [];
  const selected = data?.days.find((day) => day.solarDate === selectedDate) ?? null;
  const canGoPrev = year > MIN_YEAR || month > 1;
  const canGoNext = year < MAX_YEAR || month < 12;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const enabledReminders = profile?.reminders.filter((row) => row.enabled) ?? [];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{messages.calendar.title}</Text>

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.iconBtn, !canGoPrev && styles.disabled]}
            disabled={!canGoPrev}
            onPress={() => {
              const next = shiftMonth(year, month, -1);
              goToMonth(next.year, next.month);
            }}
            accessibilityLabel={messages.calendar.months[month - 1]}
          >
            <Text style={styles.iconBtnText}>⟨</Text>
          </Pressable>

          <Text style={styles.monthLabel}>{messages.calendar.months[month - 1]}</Text>
          <TextInput
            style={styles.yearInput}
            keyboardType="number-pad"
            value={yearDraft}
            onChangeText={setYearDraft}
            onBlur={commitYearDraft}
            onSubmitEditing={commitYearDraft}
            maxLength={4}
          />

          <Pressable
            style={[styles.iconBtn, !canGoNext && styles.disabled]}
            disabled={!canGoNext}
            onPress={() => {
              const next = shiftMonth(year, month, 1);
              goToMonth(next.year, next.month);
            }}
          >
            <Text style={styles.iconBtnText}>⟩</Text>
          </Pressable>

          <Pressable
            style={[styles.jumpBtn, isCurrentMonth && styles.disabled]}
            disabled={isCurrentMonth}
            onPress={() => {
              const today = new Date();
              goToMonth(today.getFullYear(), today.getMonth() + 1);
            }}
          >
            <Text style={styles.jumpText}>{messages.calendar.jumpToday}</Text>
          </Pressable>
        </View>

        {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {selected ? (
          <DayDetail day={selected} locale={locale} messages={messages} reminders={enabledReminders} />
        ) : null}

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {fastingDays.length === 0
              ? messages.calendar.noFastingDays
              : `${messages.calendar.fastingDaysHeading} · ${fastingDays.length}`}
          </Text>
          <View style={styles.summaryDays}>
            {fastingDays.map((day) => {
              const active = day.solarDate === selectedDate;
              return (
                <Pressable
                  key={day.solarDate}
                  style={[styles.summaryChip, active && styles.summaryChipActive]}
                  onPress={() => setSelectedDate(day.solarDate)}
                >
                  <Text style={[styles.summaryChipText, active && styles.summaryChipTextActive]}>
                    {parseIsoDate(day.solarDate).getDate()}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grid}>
          {messages.calendar.weekdays.map((day, index) => (
            <Text key={day} style={[styles.weekday, index === 6 && styles.weekdayWeekend]}>
              {day}
            </Text>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <View key={`e-${i}`} style={styles.cellEmpty} />
          ))}
          {(data?.days ?? []).map((day, index) => {
            const solarDay = parseIsoDate(day.solarDate).getDate();
            const weekend = (blanks + index) % 7 === 6;
            const selectedCell = day.solarDate === selectedDate;
            return (
              <Pressable
                key={day.solarDate}
                style={[
                  styles.cell,
                  day.isFasting && styles.cellFasting,
                  day.isToday && styles.cellToday,
                  selectedCell && !day.isToday && styles.cellSelected,
                ]}
                onPress={() => setSelectedDate(day.solarDate)}
              >
                <Text style={[styles.solar, weekend && styles.solarWeekend, day.isToday && styles.solarToday]}>
                  {solarDay}
                </Text>
                <Text style={styles.lunar}>{lunarCell(day.lunar, locale)}</Text>
                {day.isFasting ? <View style={styles.dot} /> : null}
              </Pressable>
            );
          })}
        </View>

        {loading && !data ? <ActivityIndicator color={colors.jade700} /> : null}

        <View style={styles.legend}>
          <Text style={styles.legendText}>● {messages.calendar.legendFasting}</Text>
          <Text style={styles.legendText}>□ {messages.calendar.legendToday}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
            const slotKey = row.slotKey as keyof typeof messages.settings.slots;
            const label = messages.settings.slots[slotKey] ?? row.slotKey;
            return `${label} ${formatClock(row.localTime)}`;
          })
          .join(' · ');

  return (
    <View style={[styles.detail, day.isFasting && styles.detailFasting]}>
      <Text style={styles.detailDate}>
        {formatLongDate(day.solarDate, locale)}
        {day.isToday ? <Text style={styles.detailToday}> {messages.calendar.today}</Text> : null}
      </Text>
      <Text style={styles.detailLunar}>{lunarPhrase(day.lunar, locale)}</Text>
      <Text style={day.isFasting ? styles.detailFastingLabel : styles.detailPlain}>
        {day.isFasting ? messages.calendar.legendFasting : messages.calendar.notFastingDay}
      </Text>
      {day.isFasting ? <Text style={styles.detailReminders}>{reminderLine}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  scroll: { padding: space.lg, gap: space.md, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconBtn: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtnText: { color: colors.jade800, fontFamily: fonts.bodySemi },
  disabled: { opacity: 0.4 },
  monthLabel: {
    fontSize: 22,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
  },
  yearInput: {
    width: 72,
    paddingVertical: 4,
    fontSize: 22,
    fontFamily: fonts.display,
    color: colors.jade950,
    textAlign: 'center',
  },
  jumpBtn: { paddingHorizontal: 8, paddingVertical: 8 },
  jumpText: { color: colors.jade800, fontFamily: fonts.bodyBold },
  summary: { gap: 8 },
  summaryText: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 14 },
  summaryDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryChip: {
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.lotusMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryChipActive: { backgroundColor: colors.lotusDeep },
  summaryChipText: { color: colors.lotusDeep, fontFamily: fonts.bodyBold },
  summaryChipTextActive: { color: colors.white },
  detail: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 2,
  },
  detailFasting: { borderColor: 'rgba(196, 92, 106, 0.28)', backgroundColor: '#fdf7f8' },
  detailDate: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.jade950,
    letterSpacing: -0.3,
  },
  detailToday: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.jade700 },
  detailLunar: { color: colors.inkSoft, fontFamily: fonts.body, marginTop: 2 },
  detailFastingLabel: { marginTop: 8, color: colors.lotusDeep, fontFamily: fonts.bodyBold },
  detailPlain: { marginTop: 8, color: colors.inkSoft, fontFamily: fonts.bodyMedium },
  detailReminders: { color: colors.inkSoft, fontFamily: fonts.body, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.inkSoft,
    marginBottom: 4,
  },
  weekdayWeekend: { color: colors.muted },
  cellEmpty: { width: '14.28%', minHeight: 58 },
  cell: {
    width: '14.28%',
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 4,
    backgroundColor: colors.paper,
    marginBottom: 4,
  },
  cellFasting: {
    backgroundColor: '#fdf7f8',
    borderColor: 'rgba(196, 92, 106, 0.28)',
    borderLeftWidth: 3,
    borderLeftColor: colors.lotusSoft,
  },
  cellToday: { borderColor: colors.jade600, borderWidth: 2 },
  cellSelected: { borderColor: colors.jade700, borderWidth: 2 },
  solar: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.jade950 },
  solarWeekend: { color: colors.muted },
  solarToday: { color: colors.jade800 },
  lunar: { fontSize: 11, color: colors.inkSoft, fontFamily: fonts.body },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lotus,
    marginTop: 2,
  },
  legend: { flexDirection: 'row', gap: 16 },
  legendText: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
