import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';

export function LoginScreen() {
  const { api, signIn } = useAuth();
  const { messages } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const tokens = await api.login(email.trim(), password);
      await signIn(tokens);
    } catch (e) {
      setError(e instanceof Error ? e.message : messages.common.signInFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langRow}>
        <LanguageSwitcher />
      </View>
      <Text style={styles.brand}>Sen</Text>
      <Text style={styles.subtitle}>{messages.login.subtitle}</Text>
      <TextInput
        style={styles.input}
        placeholder={messages.common.email}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={messages.common.password}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title={messages.common.signIn} onPress={handleLogin} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  langRow: { position: 'absolute', top: 16, right: 16 },
  brand: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#2d6a4f' },
  subtitle: { textAlign: 'center', marginBottom: 24, color: '#555' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  error: { color: '#c1121f' },
});
