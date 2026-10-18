import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../lib/AuthContext';
import { ApiError } from '../lib/api';
import type { AiQuota, RecipeDetail, RecipeSummary } from '../lib/api';
import { useI18n } from '../lib/i18n/I18nProvider';
import { colors, fonts, radius, space, type } from '../theme';

type Filter = 'all' | 'easy' | 'saved';

export function RecipesScreen() {
  const { api } = useAuth();
  const { locale, messages } = useI18n();
  const copy = messages.recipes;
  const [filter, setFilter] = useState<Filter>('all');
  const [noOnion, setNoOnion] = useState(false);
  const [items, setItems] = useState<RecipeSummary[]>([]);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [quota, setQuota] = useState<AiQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return Promise.allSettled([
      api.me(),
      api.aiQuota(),
      api.recipes({
        tag: filter === 'easy' ? 'easy' : undefined,
        bookmarked: filter === 'saved',
        noOnion,
      }),
    ]).then(([me, quotaResult, list]) => {
      if (me.status === 'fulfilled') setNoOnion(me.value.preferNoOnionGarlic);
      if (quotaResult.status === 'fulfilled') setQuota(quotaResult.value);
      if (list.status === 'fulfilled') setItems(list.value);
      else setError(list.reason instanceof Error ? list.reason.message : messages.common.error);
    });
  }, [api, filter, messages.common.error, noOnion]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      load().finally(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  async function openRecipe(id: string) {
    setError(null);
    try {
      setDetail(await api.recipe(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.common.error);
    }
  }

  async function toggleBookmark(recipe: { id: string; bookmarked: boolean }) {
    setError(null);
    try {
      if (recipe.bookmarked) {
        await api.unbookmarkRecipe(recipe.id);
      }
      const next = recipe.bookmarked ? await api.recipe(recipe.id) : await api.bookmarkRecipe(recipe.id);
      setDetail(next);
      setItems((current) => current.map((item) => (item.id === next.id ? { ...item, bookmarked: next.bookmarked } : item)));
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.common.error);
    }
  }

  async function suggest() {
    setSuggesting(true);
    setNotice(null);
    setError(null);
    try {
      const next = await api.suggestRecipe();
      setDetail(next);
      setQuota(await api.aiQuota());
    } catch (e) {
      if (e instanceof ApiError && e.code === 'AI_UNAVAILABLE') {
        setNotice(copy.offline);
        if (e.fallbackRecipeIds[0]) openRecipe(e.fallbackRecipeIds[0]);
      } else {
        setError(e instanceof Error ? e.message : messages.common.error);
      }
    } finally {
      setSuggesting(false);
    }
  }

  const titleOf = (item: { title: string; titleEn: string }) => (locale === 'vi' ? item.title : item.titleEn);
  const textOf = (line: { vi: string; en: string }) => (locale === 'vi' ? line.vi : line.en);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.disclaimer}>{copy.disclaimer}</Text>
        {quota ? <Text style={styles.meta}>{copy.quota.replace('{remaining}', String(quota.remaining))}</Text> : null}
        <Pressable style={[styles.primary, suggesting && styles.disabled]} disabled={suggesting} onPress={suggest}>
          {suggesting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>{copy.suggest}</Text>}
        </Pressable>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {detail ? (
          <View style={styles.card}>
            <Pressable onPress={() => setDetail(null)} hitSlop={8}>
              <Text style={styles.link}>{messages.nav.recipes}</Text>
            </Pressable>
            <Text style={styles.cardTitle}>{titleOf(detail)}</Text>
            <Text style={styles.meta}>
              {copy.minutes.replace('{count}', String(detail.cookMinutes))}
              {' · '}
              {copy.servings.replace('{count}', String(detail.servings))}
            </Text>
            <Text style={styles.body}>{locale === 'vi' ? detail.summary : detail.summaryEn}</Text>
            {detail.ingredients.map((line) => (
              <Text key={textOf(line)} style={styles.body}>
                · {textOf(line)}
              </Text>
            ))}
            {detail.steps.map((line, index) => (
              <Text key={`${index}-${textOf(line)}`} style={styles.body}>
                {index + 1}. {textOf(line)}
              </Text>
            ))}
            <Pressable style={styles.secondary} onPress={() => toggleBookmark(detail)}>
              <Text style={styles.secondaryText}>{detail.bookmarked ? copy.bookmarked : copy.bookmark}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.filters}>
              {(['all', 'easy', 'saved'] as const).map((key) => (
                <Pressable key={key} style={[styles.chip, filter === key && styles.chipOn]} onPress={() => setFilter(key)}>
                  <Text style={[styles.chipText, filter === key && styles.chipTextOn]}>
                    {key === 'all' ? copy.all : key === 'easy' ? copy.easy : copy.savedFilter}
                  </Text>
                </Pressable>
              ))}
            </View>
            {loading ? <ActivityIndicator color={colors.jade700} /> : null}
            {!loading && items.length === 0 ? <Text style={styles.meta}>{copy.empty}</Text> : null}
            {items.map((item) => (
              <Pressable key={item.id} style={styles.card} onPress={() => openRecipe(item.id)}>
                <Text style={styles.cardTitle}>{titleOf(item)}</Text>
                <Text style={styles.body}>{locale === 'vi' ? item.summary : item.summaryEn}</Text>
                <Text style={styles.meta}>{copy.minutes.replace('{count}', String(item.cookMinutes))}</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  scroll: { padding: space.xl, gap: space.md, paddingBottom: 40 },
  title: { fontSize: 28, fontFamily: fonts.display, color: colors.jade950, letterSpacing: -0.4 },
  disclaimer: { ...type.sectionLabel, textTransform: 'none', letterSpacing: 0, lineHeight: 18 },
  meta: { color: colors.inkSoft, fontFamily: fonts.body, fontSize: 14 },
  body: { color: colors.ink, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  primary: {
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.jade800,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  disabled: { opacity: 0.6 },
  notice: { color: colors.jade900, fontFamily: fonts.bodyMedium },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
  filters: { flexDirection: 'row', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  chipOn: { backgroundColor: colors.mistDeep, borderColor: colors.mistDeep },
  chipText: { fontFamily: fonts.bodySemi, color: colors.inkSoft },
  chipTextOn: { color: colors.jade950, fontFamily: fonts.bodyBold },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.lg,
    gap: 6,
  },
  cardTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.jade950 },
  link: { color: colors.jade700, fontFamily: fonts.bodyBold },
  secondary: {
    marginTop: 8,
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: colors.jade800, fontFamily: fonts.bodyBold },
});
