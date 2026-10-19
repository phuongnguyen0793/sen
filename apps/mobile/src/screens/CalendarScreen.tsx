import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { CheckInStatus, FastingProfile, MonthCalendar, UpcomingDay } from '../lib/api';
import { CheckInActions } from '../components/CheckInActions';
import { formatClock, formatLongDate, lunarCell, lunarLabel, parseIsoDate } from '../lib/format';
import { colors, fonts, radius, space, touchTarget, type } from '../theme';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
/** Cells are a fixed seventh of the width; beyond this the lunar label no longer fits. */
const CELL_MAX_FONT_SCALE = 1.3;

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
  const navigation = useNavigation();
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
  const [upcoming, setUpcoming] = useState<UpcomingDay[] | null>(null);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus | null>(null);
  const [todayIso, setTodayIso] = useState<string | null>(null);
  const checkInGeneration = useRef(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setUpcomingError(null);
      api
        .me()
        .then((me) => {
          if (!cancelled) setTodayIso(isoDateInTimezone(me.timezone));
        })
        .catch(() => undefined);
      api
        .upcoming()
        .then((result) => {
          if (!cancelled) setUpcoming(result.days);
        })
        .catch((e) => {
          if (!cancelled) {
            setUpcoming(null);
            setUpcomingError(e instanceof Error ? e.message : messages.common.error);
          }
        });
      return () => {
        cancelled = true;
      };
    }, [api, messages.common.error]),
  );

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
        if (!cancelled) {
          setData(result);
          setError(null);
        }
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

  useEffect(() => {
    if (!todayIso || !selected?.isFasting || selected.solarDate > todayIso) {
      setCheckInStatus(null);
      return;
    }
    const generation = checkInGeneration.current;
    let cancelled = false;
    api
      .checkIns(selected.solarDate, selected.solarDate)
      .then((rows) => {
        if (!cancelled && generation === checkInGeneration.current) {
          setCheckInStatus(rows[0]?.status ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, selected, todayIso]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{messages.calendar.title}</Text>
          {!isCurrentMonth ? (
            <Pressable
              style={styles.jumpBtn}
              accessibilityRole="button"
              onPress={() => {
                const today = new Date();
                goToMonth(today.getFullYear(), today.getMonth() + 1);
              }}
            >
              <Text style={styles.jumpText}>{messages.calendar.jumpToday}</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.toolbar}>
          <Pressable
            style={[styles.iconBtn, !canGoPrev && styles.disabled]}
            disabled={!canGoPrev}
            accessibilityRole="button"
            accessibilityLabel={messages.calendar.prevMonth}
            onPress={() => {
              const next = shiftMonth(year, month, -1);
              goToMonth(next.year, next.month);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.jade800} />
          </Pressable>

          <View style={styles.monthHeading}>
            <Text style={styles.monthLabel}>{messages.calendar.months[month - 1]}</Text>
            <TextInput
              style={styles.yearInput}
              keyboardType="number-pad"
              returnKeyType="done"
              selectTextOnFocus
              accessibilityLabel={messages.calendar.year}
              value={yearDraft}
              onChangeText={setYearDraft}
              onBlur={commitYearDraft}
              onSubmitEditing={commitYearDraft}
              maxLength={4}
            />
          </View>

          <Pressable
            style={[styles.iconBtn, !canGoNext && styles.disabled]}
            disabled={!canGoNext}
            accessibilityRole="button"
            accessibilityLabel={messages.calendar.nextMonth}
            onPress={() => {
              const next = shiftMonth(year, month, 1);
              goToMonth(next.year, next.month);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.jade800} />
          </Pressable>
        </View>

        {yearError ? <Text style={styles.error}>{yearError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View accessibilityState={{ busy: loading }}>
          <View style={[styles.monthBody, loading && styles.stale]}>
            {selected ? (
              <DayDetail
                day={selected}
                locale={locale}
                messages={messages}
                reminders={enabledReminders}
                checkInStatus={checkInStatus}
                onOpenRecipes={() => navigation.navigate('Recipes' as never)}
                onCheckIn={
                  todayIso && selected.isFasting && selected.solarDate <= todayIso
                    ? (status) => {
                        checkInGeneration.current += 1;
                        const previous = checkInStatus;
                        setCheckInStatus(status);
                        api.upsertCheckIn(selected.solarDate, status).catch(() => setCheckInStatus(previous));
                      }
                    : undefined
                }
              />
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
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={formatLongDate(day.solarDate, locale)}
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
              {(data?.days ?? []).map((day) => {
                const solarDay = parseIsoDate(day.solarDate).getDate();
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
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedCell }}
                    accessibilityLabel={[
                      formatLongDate(day.solarDate, locale),
                      lunarLabel(day.lunar, locale),
                      day.isToday ? messages.calendar.today : null,
                      day.isFasting ? messages.calendar.legendFasting : null,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    onPress={() => setSelectedDate(day.solarDate)}
                  >
                    <Text
                      style={[styles.solar, day.isToday && styles.solarToday]}
                      maxFontSizeMultiplier={CELL_MAX_FONT_SCALE}
                    >
                      {solarDay}
                    </Text>
                    <Text style={styles.lunar} maxFontSizeMultiplier={CELL_MAX_FONT_SCALE}>
                      {lunarCell(day.lunar, locale)}
                    </Text>
                    {day.isFasting ? <View style={styles.dot} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator style={data ? styles.overlaySpinner : undefined} color={colors.jade700} />
          ) : null}
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, styles.cellFasting]} />
            <Text style={styles.legendText}>{messages.calendar.legendFasting}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.swatch, styles.cellToday]} />
            <Text style={styles.legendText}>{messages.calendar.legendToday}</Text>
          </View>
          <Text style={styles.legendText}>{messages.calendar.legendLunar}</Text>
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>{messages.calendar.upcomingHeading}</Text>
          {upcomingError ? (
            <Text style={styles.error}>{upcomingError}</Text>
          ) : upcoming === null ? (
            <ActivityIndicator color={colors.jade700} />
          ) : upcoming.length === 0 ? (
            <Text style={styles.detailLunar}>{messages.calendar.upcomingEmpty}</Text>
          ) : (
            upcoming.map((day) => {
              const when =
                day.daysUntil === 0
                  ? messages.calendar.upcomingToday
                  : day.daysUntil === 1
                    ? messages.calendar.upcomingTomorrow
                    : messages.calendar.upcomingIn.replace('{count}', String(day.daysUntil));
              return (
                <Pressable
                  key={day.solarDate}
                  style={styles.upcomingRow}
                  accessibilityRole="button"
                  onPress={() => {
                    const date = parseIsoDate(day.solarDate);
                    const dayYear = date.getFullYear();
                    const dayMonth = date.getMonth() + 1;
                    if (dayYear !== year || dayMonth !== month) goToMonth(dayYear, dayMonth);
                    setSelectedDate(day.solarDate);
                  }}
                >
                  <View style={styles.upcomingCopy}>
                    <Text style={styles.upcomingDate}>{formatLongDate(day.solarDate, locale)}</Text>
                    <Text style={styles.detailLunar}>{lunarLabel(day.lunar, locale)}</Text>
                  </View>
                  <Text style={styles.upcomingWhen}>{when}</Text>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function isoDateInTimezone(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;
  if (!year || !month || !day) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  return `${year}-${month}-${day}`;
}

function DayDetail({
  day,
  locale,
  messages,
  reminders,
  checkInStatus,
  onCheckIn,
  onOpenRecipes,
}: {
  day: CalendarDay;
  locale: 'en' | 'vi';
  messages: ReturnType<typeof useI18n>['messages'];
  reminders: FastingProfile['reminders'];
  checkInStatus: CheckInStatus | null;
  onCheckIn?: (status: 'DONE' | 'MISSED') => void;
  onOpenRecipes?: () => void;
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
      {day.isToday ? <Text style={styles.todayBadge}>{messages.calendar.today}</Text> : null}
      <Text style={styles.detailDate}>{formatLongDate(day.solarDate, locale)}</Text>
      <Text style={styles.detailLunar}>{lunarLabel(day.lunar, locale)}</Text>
      <Text style={day.isFasting ? styles.detailFastingLabel : styles.detailPlain}>
        {day.isFasting ? messages.calendar.legendFasting : messages.calendar.notFastingDay}
      </Text>
      {day.isFasting ? <Text style={styles.detailReminders}>{reminderLine}</Text> : null}
      {day.isFasting && onOpenRecipes ? (
        <Pressable onPress={onOpenRecipes} hitSlop={8}>
          <Text style={styles.upcomingWhen}>{messages.recipes.open}</Text>
        </Pressable>
      ) : null}
      {onCheckIn ? (
        <CheckInActions
          status={checkInStatus}
          doneLabel={messages.today.checkInDone}
          missedLabel={messages.today.checkInMissed}
          onChange={onCheckIn}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  scroll: { padding: space.lg, gap: space.md, paddingBottom: 40 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    minHeight: touchTarget,
  },
  title: {
    flexShrink: 1,
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  iconBtn: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
  },
  disabled: { opacity: 0.4 },
  monthHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  monthLabel: {
    fontSize: 22,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
  },
  yearInput: {
    minWidth: 76,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.paper,
    fontSize: 22,
    fontFamily: fonts.display,
    color: colors.jade950,
    textAlign: 'center',
  },
  jumpBtn: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
  },
  jumpText: { color: colors.jade800, fontFamily: fonts.bodyBold },
  monthBody: { gap: space.md },
  stale: { opacity: 0.45 },
  overlaySpinner: { position: 'absolute', top: 120, alignSelf: 'center' },
  summary: { gap: 8 },
  summaryText: type.sectionLabel,
  summaryDays: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryChip: {
    minWidth: touchTarget,
    height: touchTarget,
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
  todayBadge: {
    alignSelf: 'flex-start',
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.mistDeep,
    color: colors.jade800,
    fontFamily: fonts.bodyBold,
    fontSize: 12,
  },
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
  solarToday: { color: colors.jade800 },
  lunar: { fontSize: 12, color: colors.inkSoft, fontFamily: fonts.body },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.lotus,
    marginTop: 2,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 16, rowGap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  legendText: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    minHeight: touchTarget,
  },
  upcomingCopy: { flex: 1, gap: 2 },
  upcomingDate: { fontFamily: fonts.bodySemi, fontSize: 15, color: colors.jade950 },
  upcomingWhen: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.jade700 },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
