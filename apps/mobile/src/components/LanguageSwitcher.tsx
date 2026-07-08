import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { Locale } from '../lib/i18n/types';

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
  row: { flexDirection: 'row', gap: 8 },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2d6a4f',
  },
  buttonSelected: { backgroundColor: '#2d6a4f' },
  label: { color: '#2d6a4f', fontWeight: '500' },
  labelSelected: { color: '#fff', fontWeight: '700' },
});
