import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { TodayStatus } from '../lib/api';
import { colors, fonts, radius, space } from '../theme';

export function HomeScreen() {
  const { api } = useAuth();
  const { messages } = useI18n();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .today()
      .then(setToday)
      .catch((e) => setError(e instanceof Error ? e.message : messages.today.loadError))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, messages.today.loadError]);

  if (loading && !today) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.jade700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{messages.today.title}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {today ? (
          <View style={[styles.hero, today.isFasting && styles.heroFasting]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{messages.today.title}</Text>
            </View>
            <Text style={styles.date}>{today.solarDate}</Text>
            <Text style={styles.lunar}>
              {messages.today.lunar} {today.lunar.day}/{today.lunar.month}
              {today.lunar.leapMonth ? ` ${messages.today.leapMonth}` : ''}
            </Text>
            <Text style={styles.status}>
              {today.isFasting ? messages.today.fasting : messages.today.notFasting}
            </Text>
          </View>
        ) : null}
        <Pressable style={styles.refreshBtn} onPress={load}>
          <Text style={styles.refreshText}>{messages.common.refresh}</Text>
        </Pressable>
      </View>
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
  container: { flex: 1, padding: space.xl, gap: space.lg },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
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
    backgroundColor: colors.mistDeep,
    borderColor: 'rgba(42, 135, 105, 0.28)',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(42, 135, 105, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: space.md,
  },
  badgeText: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.jade700,
    fontFamily: fonts.bodyBold,
  },
  date: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.5,
  },
  lunar: { marginTop: 8, color: colors.muted, fontFamily: fonts.body },
  status: {
    marginTop: 14,
    fontSize: 17,
    fontFamily: fonts.bodySemi,
    color: colors.jade900,
  },
  refreshBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  refreshText: { color: colors.jade800, fontFamily: fonts.bodySemi },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
