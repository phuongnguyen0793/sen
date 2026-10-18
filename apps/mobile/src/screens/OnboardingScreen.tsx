import React, { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import { requestNotificationPermission } from '../lib/push';
import { colors, fonts, radius, space } from '../theme';

const ONBOARDED_KEY = 'sen.onboarded';
const PRESETS = ['MUNG_1', 'DAY_15', 'MUNG_1_AND_15'] as const;

export async function isOnboarded() {
  return (await SecureStore.getItemAsync(ONBOARDED_KEY)) === '1';
}

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { api } = useAuth();
  const { messages } = useI18n();
  const copy = messages.onboarding;
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(preset: (typeof PRESETS)[number]) {
    setBusy(true);
    setError(null);
    try {
      await api.updateFastingProfile(preset);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function finish(ask: boolean) {
    setBusy(true);
    try {
      if (ask) await requestNotificationPermission(api);
      await SecureStore.setItemAsync(ONBOARDED_KEY, '1');
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <Text style={styles.step}>{step + 1} / 3</Text>
        {step === 0 ? (
          <>
            <Text style={styles.title}>{copy.welcomeTitle}</Text>
            <Text style={styles.text}>{copy.welcomeBody}</Text>
            <Pressable style={styles.primary} onPress={() => setStep(1)}>
              <Text style={styles.primaryText}>{copy.next}</Text>
            </Pressable>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={styles.title}>{copy.scheduleTitle}</Text>
            <Text style={styles.text}>{copy.scheduleBody}</Text>
            {PRESETS.map((preset) => (
              <Pressable key={preset} style={styles.choice} disabled={busy} onPress={() => choose(preset)}>
                <Text style={styles.choiceText}>{messages.settings.presets[preset]}</Text>
              </Pressable>
            ))}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Text style={styles.title}>{copy.notifyTitle}</Text>
            <Text style={styles.text}>{copy.notifyBody}</Text>
            <Pressable style={styles.primary} disabled={busy} onPress={() => finish(true)}>
              <Text style={styles.primaryText}>{copy.allow}</Text>
            </Pressable>
            <Pressable style={styles.choice} disabled={busy} onPress={() => finish(false)}>
              <Text style={styles.choiceText}>{copy.skip}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  body: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.md },
  step: { color: colors.muted, fontFamily: fonts.bodySemi },
  title: { fontFamily: fonts.display, fontSize: 32, color: colors.jade950, letterSpacing: -0.4 },
  text: { fontFamily: fonts.body, fontSize: 17, lineHeight: 24, color: colors.ink },
  primary: {
    minHeight: 50,
    borderRadius: radius.pill,
    backgroundColor: colors.jade800,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  primaryText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  choice: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  choiceText: { color: colors.jade800, fontFamily: fonts.bodySemi, fontSize: 16 },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
});
