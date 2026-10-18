import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
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
  const [displayName, setDisplayName] = useState('');
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
          : await api.register(email.trim(), password, displayName.trim() || undefined);
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>Sen</Text>
          <Text style={styles.subtitle}>{messages.login.subtitle}</Text>

          <View style={styles.card}>
            <Text style={styles.heading}>
              {mode === 'login' ? messages.login.titleSignIn : messages.login.titleRegister}
            </Text>
            {mode === 'register' ? (
              <TextInput
                style={styles.input}
                placeholder={messages.login.displayName}
                placeholderTextColor={colors.muted}
                autoComplete="name"
                textContentType="name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            ) : null}
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
            <View style={styles.divider} />
            <Pressable
              onPress={() => setMode(mode === 'login' ? 'register' : 'login')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>
                {mode === 'login' ? messages.login.titleRegister : messages.login.titleSignIn}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  flex: { flex: 1 },
  langRow: { position: 'absolute', top: 16, right: 20, zIndex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingTop: 72,
    paddingBottom: 32,
  },
  brand: {
    fontSize: 56,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -1.5,
  },
  subtitle: {
    marginTop: 10,
    marginBottom: space.xl,
    maxWidth: 340,
    color: colors.ink,
    fontFamily: fonts.body,
    fontSize: 18,
    lineHeight: 26,
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
  },
  input: {
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.paper,
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
  divider: { height: 1, backgroundColor: colors.line, marginTop: 4 },
  secondaryBtn: {
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryBtnText: { color: colors.jade800, fontFamily: fonts.bodySemi, fontSize: 15 },
});
