import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
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
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const tokens =
        mode === 'login'
          ? await api.login(email.trim(), password)
          : await api.register(email.trim(), password);
      await signIn(tokens);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : mode === 'login'
            ? messages.common.signInFailed
            : messages.common.signUpFailed,
      );
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
      <Text style={styles.heading}>
        {mode === 'login' ? messages.login.titleSignIn : messages.login.titleRegister}
      </Text>
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
        placeholder={messages.common.passwordHint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator color="#2d6a4f" />
      ) : (
        <Pressable style={styles.primaryBtn} onPress={handleSubmit}>
          <Text style={styles.primaryBtnText}>
            {mode === 'login' ? messages.common.signIn : messages.common.signUp}
          </Text>
        </Pressable>
      )}
      <Pressable
        onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {mode === 'login' ? messages.login.toggleToRegister : messages.login.toggleToSignIn}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  langRow: { position: 'absolute', top: 16, right: 16, zIndex: 1 },
  brand: { fontSize: 36, fontWeight: '700', textAlign: 'center', color: '#2d6a4f' },
  subtitle: { textAlign: 'center', color: '#555' },
  heading: { textAlign: 'center', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  error: { color: '#c1121f' },
  primaryBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  toggle: { alignItems: 'center', paddingVertical: 8 },
  toggleText: { color: '#2d6a4f', fontWeight: '500' },
});
