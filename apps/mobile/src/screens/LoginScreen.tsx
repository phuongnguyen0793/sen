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
import { colors, fonts, radius, space } from '../theme';

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.langRow}>
        <LanguageSwitcher />
      </View>

      <View style={styles.hero}>
        <View style={styles.moonRing} />
        <View style={styles.moon} />
        <Text style={styles.brand}>Sen</Text>
        <Text style={styles.subtitle}>{messages.login.subtitle}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>
          {mode === 'login' ? messages.login.titleSignIn : messages.login.titleRegister}
        </Text>
        <TextInput
          style={styles.input}
          placeholder={messages.common.email}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={messages.common.passwordHint}
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading ? (
          <ActivityIndicator color={colors.jade700} style={{ marginVertical: 8 }} />
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.foam,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
  },
  langRow: { position: 'absolute', top: 16, right: 20, zIndex: 1 },
  hero: { alignItems: 'center', marginBottom: space.xl },
  moonRing: {
    position: 'absolute',
    top: -36,
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(26, 84, 67, 0.12)',
  },
  moon: {
    position: 'absolute',
    top: -18,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#f0e6d2',
    opacity: 0.85,
  },
  brand: {
    marginTop: 72,
    fontSize: 56,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -1.5,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: colors.inkSoft,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space.xl,
    gap: space.md,
    shadowColor: colors.jade950,
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
  },
  heading: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.jade950,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    fontFamily: fonts.body,
    color: colors.ink,
    fontSize: 16,
  },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
  primaryBtn: {
    backgroundColor: colors.jade800,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  toggle: { alignItems: 'center', paddingVertical: 6 },
  toggleText: { color: colors.jade700, fontFamily: fonts.bodySemi },
});
