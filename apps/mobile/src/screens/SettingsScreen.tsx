import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import type { FastingProfile } from '../lib/api';

const SLOT_LABELS: Record<string, string> = {
  EVE_BEFORE: 'Evening before',
  MORNING: 'Morning of',
  FOLLOWUP: 'Follow-up',
};

export function SettingsScreen() {
  const { api, signOut } = useAuth();
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
      <Text style={styles.title}>Schedule & reminders</Text>
      <Text>Preset: {profile?.preset}</Text>
      {profile?.reminders.map((r) => (
        <View key={r.slotKey} style={styles.row}>
          <Text>
            {SLOT_LABELS[r.slotKey] ?? r.slotKey} — {r.enabled ? 'on' : 'off'} at {r.localTime}
          </Text>
        </View>
      ))}
      <Button title="Sign out" onPress={signOut} color="#c1121f" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { paddingVertical: 6 },
});
