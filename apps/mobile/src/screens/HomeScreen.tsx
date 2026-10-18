import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { FastingProfile, MonthCalendar, TodayStatus } from '../lib/api';
import { formatClock, formatLongDate, formatMonthYear, formatWeekday, lunarPhrase, parseIsoDate } from '../lib/format';
import { colors, fonts, radius, space } from '../theme';

type CalendarDay = MonthCalendar['days'][number];

export function HomeScreen() {
  const { api } = useAuth();
  const { locale, messages } = useI18n();
  const navigation = useNavigation();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [currentMonth, setCurrentMonth] = useState<MonthCalendar | null>(null);
  const [nextMonth, setNextMonth] = useState<MonthCalendar | null>(null);
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [contextReady, setContextReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const following = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

    return Promise.allSettled([
      api.today(),
      api.month(year, month),
      api.month(following.year, following.month),
      api.fastingProfile(),
    ]).then(([todayResult, current, upcoming, fasting]) => {
      if (todayResult.status === 'fulfilled') {
        setToday(todayResult.value);
        setError(null);
      } else {
        setError(
          todayResult.reason instanceof Error ? todayResult.reason.message : messages.today.loadError,
        );
      }
      if (current.status === 'fulfilled') setCurrentMonth(current.value);
      if (upcoming.status === 'fulfilled') setNextMonth(upcoming.value);
      if (fasting.status === 'fulfilled') setProfile(fasting.value);
      setContextReady(true);
    });
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, messages.today.loadError]);

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
  const countLabel =
    remaining.length === 1
      ? messages.today.monthCountOne
      : messages.today.monthCountMany.replace('{count}', String(remaining.length));

  if (loading && !today) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.jade700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.jade700}
            onRefresh={() => {
              setRefreshing(true);
              load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <Text style={styles.title}>{messages.today.title}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {today ? (
          <>
            <View style={[styles.hero, today.isFasting && styles.heroFasting]}>
              <Text style={styles.kicker}>{formatWeekday(today.solarDate, locale)}</Text>
              <Text style={styles.dayNum}>{parseIsoDate(today.solarDate).getDate()}</Text>
              <Text style={styles.monthLine}>{formatMonthYear(today.solarDate, locale)}</Text>
              <Text style={styles.lunarChip}>{lunarPhrase(today.lunar, locale)}</Text>
              <Text style={[styles.status, today.isFasting && styles.statusFasting]}>
                {today.isFasting ? messages.today.fasting : messages.today.notFasting}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.kickerLabel}>{messages.today.nextHeading}</Text>
              {nextFasting ? (
                <>
                  <Text style={styles.cardTitle}>{formatLongDate(nextFasting.solarDate, locale)}</Text>
                  <Text style={styles.cardMeta}>{lunarPhrase(nextFasting.lunar, locale)}</Text>
                </>
              ) : contextReady ? (
                <Text style={styles.cardMeta}>{messages.today.nextNone}</Text>
              ) : (
                <ActivityIndicator color={colors.jade700} />
              )}
            </View>

            {remaining.length > 0 ? (
              <View style={styles.card}>
                <Text style={styles.kickerLabel}>{messages.today.monthHeading}</Text>
                <Text style={styles.cardTitle}>{countLabel}</Text>
                <View style={styles.dayChips}>
                  {remaining.map((day) => (
                    <View key={day.solarDate} style={styles.dayChip}>
                      <Text style={styles.dayChipText}>{parseIsoDate(day.solarDate).getDate()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.kickerLabel}>{messages.today.remindersHeading}</Text>
                <Pressable onPress={() => navigation.navigate('Settings' as never)} hitSlop={8}>
                  <Text style={styles.link}>{messages.today.openReminders}</Text>
                </Pressable>
              </View>
              {enabledReminders.length > 0 ? (
                enabledReminders.map((row) => {
                  const slotKey = row.slotKey as keyof typeof messages.settings.slots;
                  const label = messages.settings.slots[slotKey] ?? row.slotKey;
                  return (
                    <View key={row.slotKey} style={styles.reminderLine}>
                      <Text style={styles.cardMeta}>{label}</Text>
                      <Text style={styles.reminderTime}>{formatClock(row.localTime)}</Text>
                    </View>
                  );
                })
              ) : contextReady ? (
                <Text style={styles.cardMeta}>{messages.today.remindersNone}</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.foam,
  },
  container: { padding: space.xl, gap: space.md, paddingBottom: 40 },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  hero: {
    padding: space.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.jade950,
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  heroFasting: {
    backgroundColor: '#fdf7f8',
    borderColor: 'rgba(196, 92, 106, 0.28)',
  },
  kicker: {
    fontFamily: fonts.bodySemi,
    fontSize: 15,
    color: colors.inkSoft,
  },
  dayNum: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 72,
    lineHeight: 76,
    letterSpacing: -2,
    color: colors.jade950,
  },
  monthLine: {
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    color: colors.jade800,
  },
  lunarChip: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
    color: colors.inkSoft,
    fontFamily: fonts.bodySemi,
  },
  status: {
    marginTop: 16,
    fontSize: 20,
    fontFamily: fonts.bodyBold,
    color: colors.jade900,
  },
  statusFasting: { color: colors.lotusDeep },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kickerLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.muted,
    fontFamily: fonts.bodyBold,
  },
  cardTitle: {
    marginTop: 4,
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.jade950,
    letterSpacing: -0.3,
  },
  cardMeta: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 15 },
  dayChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  dayChip: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.lotusMist,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: { color: colors.lotusDeep, fontFamily: fonts.bodyBold },
  link: { color: colors.jade700, fontFamily: fonts.bodyBold, fontSize: 15 },
  reminderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 8,
  },
  reminderTime: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.jade950,
    fontVariant: ['tabular-nums'],
  },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
