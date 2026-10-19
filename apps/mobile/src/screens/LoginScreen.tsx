import React, { useRef, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import { toServerLocale } from '../lib/i18n/locale';
import { colors, fonts, radius, space, touchTarget } from '../theme';

export function LoginScreen() {
  const { api, signIn } = useAuth();
  const { locale, messages } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  async function handleSubmit() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const tokens =
        mode === 'login'
          ? await api.login(email.trim(), password)
          : await api.register(
              email.trim(),
              password,
              displayName.trim() || undefined,
              toServerLocale(locale),
            );
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
      <View style={[styles.langRow, { top: insets.top + space.sm }]}>
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
              <View style={styles.field}>
                <Text style={styles.label} nativeID="login-name">
                  {messages.login.displayName}
                </Text>
                <TextInput
                  style={styles.input}
                  accessibilityLabelledBy="login-name"
                  autoComplete="name"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  value={displayName}
                  onChangeText={setDisplayName}
                />
              </View>
            ) : null}
            <View style={styles.field}>
              <Text style={styles.label} nativeID="login-email">
                {messages.common.email}
              </Text>
              <TextInput
                ref={emailRef}
                style={styles.input}
                accessibilityLabelledBy="login-email"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="username"
                returnKeyType="next"
                submitBehavior="submit"
                onSubmitEditing={() => passwordRef.current?.focus()}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label} nativeID="login-password">
                {messages.common.password}
              </Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.passwordInput]}
                  accessibilityLabelledBy="login-password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  textContentType={mode === 'login' ? 'password' : 'newPassword'}
                  returnKeyType="go"
                  onSubmitEditing={handleSubmit}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((value) => !value)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? messages.common.hidePassword : messages.common.showPassword}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color={colors.muted} />
                </Pressable>
              </View>
              {mode === 'register' ? <Text style={styles.hint}>{messages.common.passwordRule}</Text> : null}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.primaryBtn, loading && styles.primaryBtnBusy]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
              accessibilityState={{ busy: loading, disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {mode === 'login' ? messages.common.signIn : messages.common.signUp}
                </Text>
              )}
            </Pressable>
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
  langRow: { position: 'absolute', right: 20, zIndex: 1 },
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
  field: { gap: 6 },
  label: { color: colors.inkSoft, fontFamily: fonts.bodySemi, fontSize: 14 },
  hint: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  input: {
    minHeight: 48,
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
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingRight: 52 },
  eyeBtn: {
    position: 'absolute',
    right: 2,
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
  primaryBtn: {
    minHeight: 50,
    backgroundColor: colors.jade800,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnBusy: { opacity: 0.8 },
  primaryBtnText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.line, marginTop: 4 },
  secondaryBtn: {
    alignSelf: 'center',
    minHeight: touchTarget,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: radius.pill,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  secondaryBtnText: { color: colors.jade800, fontFamily: fonts.bodySemi, fontSize: 15 },
});
