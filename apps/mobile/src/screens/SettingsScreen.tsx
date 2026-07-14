import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ReminderTimePicker } from '../components/ReminderTimePicker';
import { useAuth } from '../lib/AuthContext';
import { useI18n } from '../lib/i18n/I18nProvider';
import type { FastingProfile, ReminderPreference } from '../lib/api';
import { colors, fonts, radius, space } from '../theme';

const PRESET_KEYS = ['MUNG_1', 'DAY_15', 'MUNG_1_AND_15'] as const;
const SLOT_KEYS = ['EVE_BEFORE', 'MORNING', 'FOLLOWUP'] as const;

const DEFAULT_SLOTS: ReminderPreference[] = [
  { slotKey: 'EVE_BEFORE', enabled: true, offsetDays: -1, localTime: '20:00' },
  { slotKey: 'MORNING', enabled: true, offsetDays: 0, localTime: '07:00' },
  { slotKey: 'FOLLOWUP', enabled: false, offsetDays: 0, localTime: '12:00' },
];

function toTimeInputValue(value: string) {
  const match = value.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '00:00';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}

function mergeReminderDraft(reminders: ReminderPreference[]): ReminderPreference[] {
  return SLOT_KEYS.map((slotKey) => {
    const existing = reminders.find((r) => r.slotKey === slotKey);
    const fallback = DEFAULT_SLOTS.find((r) => r.slotKey === slotKey)!;
    if (!existing) return { ...fallback };
    return {
      ...fallback,
      ...existing,
      localTime: toTimeInputValue(existing.localTime),
    };
  });
}

export function SettingsScreen() {
  const { api, signOut } = useAuth();
  const { messages } = useI18n();
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [draft, setDraft] = useState<ReminderPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPreset, setSavingPreset] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    api
      .fastingProfile()
      .then((result) => {
        setProfile(result);
        setDraft(mergeReminderDraft(result.reminders));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : messages.common.error))
      .finally(() => setLoading(false));
  }, [api, messages.common.error]);

  const dirty =
    !!profile &&
    JSON.stringify(draft) !== JSON.stringify(mergeReminderDraft(profile.reminders));

  async function changePreset(preset: string) {
    setSavingPreset(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const next = await api.updateFastingProfile(preset);
      setProfile(next);
      setDraft(mergeReminderDraft(next.reminders));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : messages.common.error);
    } finally {
      setSavingPreset(false);
    }
  }

  function updateSlot(slotKey: string, patch: Partial<ReminderPreference>) {
    setSavedMessage(null);
    setSaveError(null);
    setDraft((current) =>
      current.map((row) => (row.slotKey === slotKey ? { ...row, ...patch } : row)),
    );
  }

  async function saveReminderTimes() {
    setSavingReminders(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const payload = draft.map((row) => ({
        ...row,
        localTime: toTimeInputValue(row.localTime),
      }));
      const next = await api.updateReminders(payload);
      setProfile(next);
      setDraft(mergeReminderDraft(next.reminders));
      setSavedMessage(messages.settings.saved);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : messages.settings.saveFailed);
    } finally {
      setSavingReminders(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.jade700} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.langSection}>
          <Text style={styles.langLabel}>{messages.common.language}</Text>
          <LanguageSwitcher />
        </View>

        <Text style={styles.title}>{messages.settings.title}</Text>
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

        {profile ? (
          <>
            <Text style={styles.section}>{messages.settings.scheduleHeading}</Text>
            <View style={styles.presetList}>
              {PRESET_KEYS.map((key) => {
                const active = profile.preset === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.presetOption, active && styles.presetActive]}
                    disabled={savingPreset || active}
                    onPress={() => changePreset(key)}
                  >
                    <View style={[styles.presetMark, active && styles.presetMarkActive]} />
                    <Text style={styles.presetLabel}>{messages.settings.presets[key]}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>{messages.settings.reminderTimes}</Text>
            <Text style={styles.muted}>{messages.settings.reminderHint}</Text>

            {draft.map((row) => {
              const slotKey = row.slotKey as keyof typeof messages.settings.slots;
              const label = messages.settings.slots[slotKey] ?? row.slotKey;
              const hint = messages.settings.slotHints[slotKey];
              return (
                <View key={row.slotKey} style={styles.reminderCard}>
                  <View style={styles.reminderHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bold}>{label}</Text>
                      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
                    </View>
                    <View style={styles.toggleRow}>
                      <Text style={styles.muted}>{messages.settings.enabledLabel}</Text>
                      <Switch
                        value={row.enabled}
                        onValueChange={(enabled) => updateSlot(row.slotKey, { enabled })}
                        trackColor={{ true: colors.mistDeep, false: colors.line }}
                        thumbColor={row.enabled ? colors.jade700 : '#f4f3f4'}
                      />
                    </View>
                  </View>
                  <ReminderTimePicker
                    value={toTimeInputValue(row.localTime)}
                    enabled={row.enabled}
                    label={label}
                    doneLabel={messages.common.done}
                    onChange={(localTime) => updateSlot(row.slotKey, { localTime })}
                  />
                </View>
              );
            })}

            {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
            {savedMessage ? <Text style={styles.success}>{savedMessage}</Text> : null}

            <Pressable
              style={[styles.primaryBtn, (!dirty || savingReminders) && styles.disabled]}
              disabled={!dirty || savingReminders}
              onPress={saveReminderTimes}
            >
              <Text style={styles.primaryBtnText}>
                {savingReminders ? messages.common.pleaseWait : messages.settings.saveReminders}
              </Text>
            </Pressable>
          </>
        ) : null}

        <Pressable style={styles.signOutBtn} onPress={signOut}>
          <Text style={styles.signOutText}>{messages.common.signOut}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.foam },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.foam,
  },
  scroll: { padding: space.xl, gap: space.md, paddingBottom: 48 },
  langSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  langLabel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.inkSoft },
  title: {
    fontSize: 28,
    fontFamily: fonts.display,
    color: colors.jade950,
    letterSpacing: -0.4,
  },
  section: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.jade900,
    marginTop: 8,
  },
  muted: { color: colors.muted, fontFamily: fonts.body },
  bold: { fontFamily: fonts.bodyBold, color: colors.jade950 },
  presetList: { gap: 8 },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.sm,
    padding: 14,
  },
  presetActive: {
    backgroundColor: colors.mistDeep,
    borderColor: 'rgba(42, 135, 105, 0.4)',
  },
  presetMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.jade600,
  },
  presetMarkActive: { backgroundColor: colors.jade600 },
  presetLabel: { flex: 1, color: colors.jade950, fontFamily: fonts.bodyMedium },
  reminderCard: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    padding: 14,
    gap: 12,
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: { color: colors.muted, fontSize: 13, marginTop: 2, fontFamily: fonts.body },
  toggleRow: { alignItems: 'center', gap: 4 },
  primaryBtn: {
    backgroundColor: colors.jade800,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.bodyBold, fontSize: 16 },
  disabled: { opacity: 0.45 },
  signOutBtn: {
    marginTop: 16,
    borderRadius: radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.danger,
  },
  signOutText: { color: colors.white, fontFamily: fonts.bodyBold },
  error: { color: colors.danger, fontFamily: fonts.bodyMedium },
  success: {
    color: colors.jade900,
    backgroundColor: colors.mistDeep,
    borderColor: 'rgba(42, 135, 105, 0.28)',
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: 12,
    overflow: 'hidden',
    fontFamily: fonts.bodyMedium,
  },
});
