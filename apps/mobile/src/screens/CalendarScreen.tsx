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
import type { MonthCalendar } from '../lib/api';
import { colors, fonts, radius, space } from '../theme';

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

function leadingEmptyCount(year: number, month: number) {
  const weekday = new Date(year, month - 1, 1).getDay();
  return (weekday + 6) % 7;
}

export function CalendarScreen() {
  const { api } = useAuth();
  const { messages } = useI18n();
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
  const fastingDays = data?.days.filter((d) => d.isFasting) ?? [];
  const canGoPrev = year > MIN_YEAR || month > 1;
  const canGoNext = year < MAX_YEAR || month < 12;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

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
            style={[styles.iconBtn, isCurrentMonth && styles.disabled]}
            disabled={isCurrentMonth}
            onPress={() => {
              const today = new Date();
              goToMonth(today.getFullYear(), today.getMonth() + 1);
            }}
          >
            <Text style={styles.iconBtnText}>{messages.calendar.jumpToday}</Text>
          </Pressable>
        </View>

        <View style={styles.monthCycle}>
          {messages.calendar.months.map((label, index) => {
            const value = index + 1;
            const active = value === month;
            return (
              <Pressable
                key={label}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => goToMonth(year, value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {String(value).padStart(2, '0')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.grid}>
          {messages.calendar.weekdays.map((day) => (
            <Text key={day} style={styles.weekday}>
              {day}
            </Text>
          ))}
          {Array.from({ length: blanks }).map((_, i) => (
            <View key={`e-${i}`} style={styles.cellEmpty} />
          ))}
          {(data?.days ?? []).map((day) => {
            const solarDay = Number(day.solarDate.slice(-2));
            return (
              <View
                key={day.solarDate}
                style={[
                  styles.cell,
                  day.isFasting && styles.cellFasting,
                  day.isToday && styles.cellToday,
                ]}
              >
                <Text style={styles.solar}>{solarDay}</Text>
                <Text style={styles.lunar}>
                  {day.lunar.day}/{day.lunar.month}
                </Text>
                {day.isFasting ? <View style={styles.dot} /> : null}
              </View>
            );
          })}
        </View>

        {loading && !data ? <ActivityIndicator color={colors.jade700} /> : null}

        <View style={styles.legend}>
          <Text style={styles.legendText}>● {messages.calendar.legendFasting}</Text>
          <Text style={styles.legendText}>□ {messages.calendar.legendToday}</Text>
        </View>

        <Text style={styles.subheading}>{messages.calendar.fastingDaysHeading}</Text>
        {data && fastingDays.length === 0 ? (
          <Text style={styles.muted}>{messages.calendar.noFastingDays}</Text>
        ) : (
          fastingDays.map((d) => (
            <View key={d.solarDate} style={[styles.listCard, styles.cellFasting]}>
              <Text style={styles.listText}>
                {d.solarDate} — {messages.calendar.lunar} {d.lunar.day}/{d.lunar.month}
                {d.isToday ? ` ${messages.calendar.today}` : ''}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
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
    gap: 8,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: space.md,
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
    fontSize: 16,
    fontFamily: fonts.display,
    color: colors.jade950,
    paddingHorizontal: 4,
  },
  yearInput: {
    width: 72,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    color: colors.ink,
  },
  monthCycle: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.paper,
  },
  chipActive: {
    backgroundColor: colors.mistDeep,
    borderColor: 'rgba(42, 135, 105, 0.35)',
  },
  chipText: { fontSize: 12, color: colors.muted, fontFamily: fonts.bodyMedium },
  chipTextActive: { color: colors.jade950, fontFamily: fonts.bodyBold },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: fonts.bodyBold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.muted,
    marginBottom: 4,
  },
  cellEmpty: { width: '14.28%', minHeight: 56 },
  cell: {
    width: '14.28%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    padding: 4,
    backgroundColor: colors.paper,
    marginBottom: 4,
  },
  cellFasting: {
    backgroundColor: colors.mistDeep,
    borderColor: 'rgba(42, 135, 105, 0.35)',
  },
  cellToday: { borderColor: colors.jade600, borderWidth: 2 },
  solar: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.jade950 },
  lunar: { fontSize: 10, color: colors.muted, fontFamily: fonts.body },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.jade600,
    marginTop: 2,
  },
  legend: { flexDirection: 'row', gap: 16 },
  legendText: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  subheading: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.jade900,
    marginTop: 8,
  },
  muted: { color: colors.muted, fontFamily: fonts.body },
  listCard: {
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
  },
  listText: { fontFamily: fonts.bodyMedium, color: colors.ink },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
