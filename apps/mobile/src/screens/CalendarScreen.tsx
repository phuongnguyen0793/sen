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
    <SafeAreaView style={styles.container}>
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

        {loading && !data ? <ActivityIndicator color="#2d6a4f" /> : null}

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
              <Text>
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
  container: { flex: 1, backgroundColor: '#fafafa' },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '600', color: '#1b4332' },
  toolbar: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  iconBtn: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtnText: { color: '#2d6a4f', fontWeight: '600' },
  disabled: { opacity: 0.4 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#1b4332', paddingHorizontal: 4 },
  yearInput: {
    width: 72,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  monthCycle: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#d8f3dc', borderColor: '#95d5b2' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#1b4332', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  cellEmpty: { width: '14.28%', minHeight: 56 },
  cell: {
    width: '14.28%',
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 4,
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  cellFasting: { backgroundColor: '#d8f3dc', borderColor: '#95d5b2' },
  cellToday: { borderColor: '#2d6a4f', borderWidth: 2 },
  solar: { fontWeight: '700', fontSize: 13, color: '#1b4332' },
  lunar: { fontSize: 10, color: '#555' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#2d6a4f',
    marginTop: 2,
  },
  legend: { flexDirection: 'row', gap: 16 },
  legendText: { color: '#555', fontSize: 13 },
  subheading: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  muted: { color: '#555' },
  listCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  error: { color: '#c1121f' },
});
