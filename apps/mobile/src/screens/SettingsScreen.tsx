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
            <Text style={styles.summary}>
              {messages.settings.presets[profile.preset as keyof typeof messages.settings.presets] ??
                profile.preset}
              {' · '}
              {draft.some((row) => row.enabled)
                ? draft
                    .filter((row) => row.enabled)
                    .map((row) => {
                      const slotKey = row.slotKey as keyof typeof messages.settings.slots;
                      const label = messages.settings.slots[slotKey] ?? row.slotKey;
                      return `${label} ${toTimeInputValue(row.localTime)}`;
                    })
                    .join(' · ')
                : messages.settings.summaryOff}
            </Text>

            <Text style={styles.section}>{messages.settings.scheduleHeading}</Text>
            <View style={styles.presetSeg}>
              {PRESET_KEYS.map((key) => {
                const active = profile.preset === key;
                return (
                  <Pressable
                    key={key}
                    style={[styles.presetOption, active && styles.presetActive]}
                    disabled={savingPreset || active}
                    onPress={() => changePreset(key)}
                  >
                    <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                      {messages.settings.presets[key]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.section}>{messages.settings.reminderTimes}</Text>
            <Text style={styles.muted}>{messages.settings.reminderHint}</Text>

            <View style={styles.reminderCard}>
              {draft.map((row, index) => {
                const slotKey = row.slotKey as keyof typeof messages.settings.slots;
                const label = messages.settings.slots[slotKey] ?? row.slotKey;
                const hint = messages.settings.slotHints[slotKey];
                return (
                  <View
                    key={row.slotKey}
                    style={[styles.reminderRow, index > 0 && styles.reminderDivider, !row.enabled && styles.inactive]}
                  >
                    <View style={styles.reminderHead}>
                      <View style={styles.reminderCopy}>
                        <Text style={styles.bold}>{label}</Text>
                        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
                      </View>
                      <Switch
                        value={row.enabled}
                        onValueChange={(enabled) => updateSlot(row.slotKey, { enabled })}
                        trackColor={{ true: colors.jade600, false: colors.lineStrong }}
                        thumbColor={colors.white}
                        accessibilityLabel={`${label} — ${messages.settings.enabledLabel}`}
                      />
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
            </View>

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
  summary: {
    color: colors.inkSoft,
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    fontSize: 18,
    fontFamily: fonts.display,
    color: colors.jade900,
    marginTop: 8,
  },
  muted: { color: colors.muted, fontFamily: fonts.body },
  bold: { fontFamily: fonts.bodyBold, color: colors.jade950 },
  presetSeg: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 4,
  },
  presetOption: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  presetActive: { backgroundColor: colors.mistDeep },
  presetLabel: {
    textAlign: 'center',
    color: colors.inkSoft,
    fontFamily: fonts.bodySemi,
  },
  presetLabelActive: { color: colors.jade950, fontFamily: fonts.bodyBold },
  reminderCard: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  reminderRow: {
    padding: 14,
    gap: 10,
  },
  reminderDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  inactive: { opacity: 0.72 },
  reminderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  reminderCopy: { flex: 1, gap: 2 },
  hint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
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
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  signOutText: { color: colors.muted, fontFamily: fonts.bodySemi },
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
