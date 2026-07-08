import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import type { FastingProfile } from '../lib/api';

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
      <Text style={styles.title}>Lịch & nhắc</Text>
      <Text>Preset: {profile?.preset}</Text>
      {profile?.reminders.map((r) => (
        <View key={r.slotKey} style={styles.row}>
          <Text>
            {r.slotKey} — {r.enabled ? 'bật' : 'tắt'} @ {r.localTime}
          </Text>
        </View>
      ))}
      <Button title="Đăng xuất" onPress={signOut} color="#c1121f" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  row: { paddingVertical: 6 },
});
