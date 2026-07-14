import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { Locale } from '../lib/i18n/types';
import { colors, fonts, radius } from '../theme';

const options: { locale: Locale; label: string }[] = [
  { locale: 'en', label: 'EN' },
  { locale: 'vi', label: 'VI' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Language">
      {options.map((option) => {
        const selected = locale === option.locale;
        return (
          <Pressable
            key={option.locale}
            onPress={() => setLocale(option.locale)}
            style={[styles.button, selected && styles.buttonSelected]}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.pill,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  buttonSelected: { backgroundColor: colors.jade800 },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodySemi,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  labelSelected: { color: colors.white },
});
