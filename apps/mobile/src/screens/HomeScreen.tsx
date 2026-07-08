import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../lib/AuthContext';
import type { TodayStatus } from '../lib/api';

export function HomeScreen() {
  const { api } = useAuth();
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .today()
      .then(setToday)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải dữ liệu'))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Hôm nay</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {today ? (
        <View style={[styles.card, today.isFasting && styles.cardFasting]}>
          <Text style={styles.date}>{today.solarDate}</Text>
          <Text style={styles.lunar}>
            Âm {today.lunar.day}/{today.lunar.month}
            {today.lunar.leapMonth ? ' (nhuận)' : ''}
          </Text>
          <Text style={styles.status}>
            {today.isFasting ? 'Hôm nay là ngày chay' : 'Hôm nay không phải ngày chay'}
          </Text>
        </View>
      ) : null}
      <Button title="Làm mới" onPress={() => api.today().then(setToday)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' },
  card: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cardFasting: { backgroundColor: '#d8f3dc', borderColor: '#95d5b2' },
  date: { fontSize: 18, fontWeight: '600' },
  lunar: { marginTop: 8, color: '#555' },
  status: { marginTop: 12, fontSize: 16 },
  error: { color: '#c1121f' },
});
