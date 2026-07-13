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
        <ActivityIndicator color="#2d6a4f" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
                    <Text style={styles.presetMark}>{active ? '●' : '○'}</Text>
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
                        trackColor={{ true: '#95d5b2', false: '#dee2e6' }}
                        thumbColor={row.enabled ? '#2d6a4f' : '#f4f3f4'}
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
  container: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  langSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langLabel: { fontSize: 16, fontWeight: '500' },
  title: { fontSize: 22, fontWeight: '600', color: '#1b4332' },
  section: { fontSize: 16, fontWeight: '600', marginTop: 8 },
  muted: { color: '#555' },
  bold: { fontWeight: '700', color: '#1b4332' },
  presetList: { gap: 8 },
  presetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
  },
  presetActive: { backgroundColor: '#d8f3dc', borderColor: '#95d5b2' },
  presetMark: { color: '#2d6a4f', fontSize: 16 },
  presetLabel: { flex: 1, color: '#1b4332', fontWeight: '500' },
  reminderCard: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hint: { color: '#555', fontSize: 13, marginTop: 2 },
  toggleRow: { alignItems: 'center', gap: 4 },
  primaryBtn: {
    backgroundColor: '#2d6a4f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.45 },
  signOutBtn: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#c1121f',
  },
  signOutText: { color: '#fff', fontWeight: '700' },
  error: { color: '#c1121f' },
  success: {
    color: '#1b4332',
    backgroundColor: '#d8f3dc',
    borderColor: '#95d5b2',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    overflow: 'hidden',
  },
});
