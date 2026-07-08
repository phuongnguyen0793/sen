import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { FastingProfile } from '../lib/api';

export function SettingsScreen() {
  const { api, signOut } = useAuth();
  const { messages } = useI18n();
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fastingProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langSection}>
        <Text style={styles.langLabel}>{messages.common.language}</Text>
        <LanguageSwitcher />
      </View>
      <Text style={styles.title}>{messages.settings.title}</Text>
      <Text>
        {messages.settings.preset}: {profile?.preset}
      </Text>
      {profile?.reminders.map((r) => {
        const slotLabel =
          messages.settings.slots[r.slotKey as keyof typeof messages.settings.slots] ?? r.slotKey;
        return (
          <View key={r.slotKey} style={styles.row}>
            <Text>
              {slotLabel} — {r.enabled ? messages.common.on : messages.common.off}{' '}
              {messages.common.at} {r.localTime}
            </Text>
          </View>
        );
      })}
      <Button title={messages.common.signOut} onPress={signOut} color="#c1121f" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  langSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langLabel: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { paddingVertical: 6 },
});
