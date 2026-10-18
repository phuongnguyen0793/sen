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
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { CheckInStatus, FastingProfile, MonthCalendar, Streak, TodayStatus } from '../lib/api';
import { CheckInActions } from '../components/CheckInActions';
import { formatClock, formatLongDate, lunarLabel, lunarPhrase, parseIsoDate } from '../lib/format';
import { colors, fonts, radius, space, type } from '../theme';

type CalendarDay = MonthCalendar['days'][number];

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBetween(fromIso: string, toIso: string) {
  return Math.round((parseIsoDate(toIso).getTime() - parseIsoDate(fromIso).getTime()) / DAY_MS);
}

export function HomeScreen() {
  const { api } = useAuth();
  const { locale, messages } = useI18n();
  const navigation = useNavigation();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [currentMonth, setCurrentMonth] = useState<MonthCalendar | null>(null);
  const [nextMonth, setNextMonth] = useState<MonthCalendar | null>(null);
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInStatus | null>(null);
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
      api.me(),
      api.streak(),
    ]).then(([todayResult, current, upcoming, fasting, me, streakResult]) => {
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
      if (me.status === 'fulfilled') setDisplayName(me.value.displayName);
      if (streakResult.status === 'fulfilled') setStreak(streakResult.value);
      if (todayResult.status === 'fulfilled' && todayResult.value.isFasting) {
        api
          .checkIns(todayResult.value.solarDate, todayResult.value.solarDate)
          .then((rows) => setCheckIn(rows[0]?.status ?? null))
          .catch(() => undefined);
      } else {
        setCheckIn(null);
      }
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

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      api
        .me()
        .then((me) => {
          if (active) setDisplayName(me.displayName);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [api]),
  );

  const nextFasting = useMemo(() => {
    if (!today) return null;
    const later = (day: CalendarDay) => day.isFasting && day.solarDate > today.solarDate;
    return currentMonth?.days.find(later) ?? nextMonth?.days.find(later) ?? null;
  }, [today, currentMonth, nextMonth]);

  const moreThisMonth = useMemo(() => {
    if (!today || !currentMonth) return 0;
    return currentMonth.days.filter(
      (day) => day.isFasting && day.solarDate > today.solarDate && day.solarDate !== nextFasting?.solarDate,
    ).length;
  }, [today, currentMonth, nextFasting]);

  const enabledReminders = profile?.reminders.filter((row) => row.enabled) ?? [];
  const daysUntilNext = today && nextFasting ? daysBetween(today.solarDate, nextFasting.solarDate) : null;
  const countdown =
    daysUntilNext === 1
      ? messages.today.tomorrow
      : messages.today.daysUntil.replace('{count}', String(daysUntilNext));
  const moreLabel =
    moreThisMonth === 1
      ? messages.today.moreThisMonthOne
      : messages.today.moreThisMonthMany.replace('{count}', String(moreThisMonth));

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
        {displayName ? (
          <Text style={styles.greeting}>{messages.today.greeting.replace('{name}', displayName)}</Text>
        ) : null}
        {streak ? (
          <Text style={styles.greeting}>
            {messages.today.streak.replace('{current}', String(streak.current))}
            {' · '}
            {messages.today.streakBest.replace('{best}', String(streak.best))}
          </Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {today ? (
          <>
            <View style={[styles.hero, today.isFasting && styles.heroFasting]}>
              <Text style={styles.heroDate}>{formatLongDate(today.solarDate, locale)}</Text>
              <Text style={styles.lunarChip}>{lunarLabel(today.lunar, locale)}</Text>

              <View style={styles.heroBody}>
                {today.isFasting ? (
                  <>
                    <Text style={[styles.headline, styles.headlineFasting]}>{messages.today.fastingTitle}</Text>
                    <Text style={styles.heroMeta}>{lunarPhrase(today.lunar, locale)}</Text>
                  </>
                ) : nextFasting ? (
                  <>
                    <Text style={styles.kickerLabel}>{messages.today.nextHeading}</Text>
                    <Text style={styles.headline}>{countdown}</Text>
                    <Text style={styles.heroMeta}>
                      {formatLongDate(nextFasting.solarDate, locale)} · {lunarPhrase(nextFasting.lunar, locale)}
                    </Text>
                  </>
                ) : contextReady ? (
                  <Text style={styles.heroMeta}>{messages.today.nextNone}</Text>
                ) : (
                  <ActivityIndicator color={colors.jade700} style={styles.heroSpinner} />
                )}
              </View>

              {today.isFasting && nextFasting ? (
                <Text style={styles.heroFoot}>
                  {messages.today.nextAfter.replace('{date}', formatLongDate(nextFasting.solarDate, locale))}
                </Text>
              ) : null}
              {moreThisMonth > 0 ? <Text style={styles.heroFoot}>{moreLabel}</Text> : null}
              {today.isFasting ? (
                <CheckInActions
                  status={checkIn}
                  doneLabel={messages.today.checkInDone}
                  missedLabel={messages.today.checkInMissed}
                  onChange={(status) => {
                    setCheckIn(status);
                    api
                      .upsertCheckIn(today.solarDate, status)
                      .then(() => api.streak())
                      .then(setStreak)
                      .catch(() => setCheckIn(checkIn));
                  }}
                />
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.kickerLabel}>{messages.today.remindersHeading}</Text>
                <Pressable
                  onPress={() => navigation.navigate('Settings' as never)}
                  hitSlop={12}
                  accessibilityRole="button"
                >
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
  greeting: {
    marginTop: -8,
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.inkSoft,
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
  heroDate: {
    fontFamily: fonts.bodySemi,
    fontSize: 16,
    color: colors.inkSoft,
  },
  lunarChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  heroBody: {
    marginTop: space.lg,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    gap: 2,
  },
  headline: {
    marginTop: 2,
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    color: colors.jade950,
  },
  headlineFasting: { color: colors.lotusDeep },
  heroMeta: { color: colors.ink, fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22 },
  heroSpinner: { alignSelf: 'flex-start' },
  heroFoot: { marginTop: space.md, color: colors.inkSoft, fontFamily: fonts.body, fontSize: 15 },
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
  kickerLabel: type.sectionLabel,
  cardMeta: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 15 },
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
