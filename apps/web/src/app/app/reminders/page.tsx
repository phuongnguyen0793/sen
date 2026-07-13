'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  fetchFastingProfile,
  updateFastingProfile,
  updateReminders,
  type FastingProfile,
  type ReminderPreference,
} from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';

const PRESET_KEYS = ['MUNG_1', 'DAY_15', 'MUNG_1_AND_15'] as const;
const SLOT_KEYS = ['EVE_BEFORE', 'MORNING', 'FOLLOWUP'] as const;

const DEFAULT_SLOTS: ReminderPreference[] = [
  { slotKey: 'EVE_BEFORE', enabled: true, offsetDays: -1, localTime: '20:00' },
  { slotKey: 'MORNING', enabled: true, offsetDays: 0, localTime: '07:00' },
  { slotKey: 'FOLLOWUP', enabled: false, offsetDays: 0, localTime: '12:00' },
];

/** Normalize API LocalTime strings ("7:00", "07:00:00") for <input type="time">. */
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

export default function RemindersPage() {
  const { messages } = useI18n();
  const { isReady, isAuthenticated, getAccessToken } = useRequireAuth();
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [draft, setDraft] = useState<ReminderPreference[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [savingReminders, setSavingReminders] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    const token = getAccessToken();
    if (!token) return;
    setLoadError(null);
    fetchFastingProfile(token)
      .then((result) => {
        setProfile(result);
        setDraft(mergeReminderDraft(result.reminders));
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : messages.common.error));
  }, [isReady, isAuthenticated, getAccessToken, messages.common.error]);

  const dirty =
    !!profile &&
    JSON.stringify(draft) !== JSON.stringify(mergeReminderDraft(profile.reminders));

  async function changePreset(preset: string) {
    const token = getAccessToken();
    if (!token) return;
    setSavingPreset(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const next = await updateFastingProfile(token, preset);
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
    const token = getAccessToken();
    if (!token) return;
    setSavingReminders(true);
    setSaveError(null);
    setSavedMessage(null);
    try {
      const payload = draft.map((row) => ({
        ...row,
        localTime: toTimeInputValue(row.localTime),
      }));
      const next = await updateReminders(token, payload);
      setProfile(next);
      setDraft(mergeReminderDraft(next.reminders));
      setSavedMessage(messages.reminders.saved);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : messages.reminders.saveFailed);
    } finally {
      setSavingReminders(false);
    }
  }

  if (!isReady || !isAuthenticated) {
    return <p>{messages.common.loading}</p>;
  }

  return (
    <section>
      <h1>{messages.reminders.title}</h1>
      {loadError ? <p className="error">{loadError}</p> : null}

      {profile ? (
        <>
          <h2 style={{ fontSize: '1.1rem' }}>{messages.reminders.scheduleHeading}</h2>
          <div className="preset-list">
            {PRESET_KEYS.map((key) => {
              const active = profile.preset === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`preset-option${active ? ' active' : ''}`}
                  disabled={savingPreset || active}
                  onClick={() => changePreset(key)}
                  aria-pressed={active}
                >
                  <span aria-hidden>{active ? '●' : '○'}</span>
                  {messages.reminders.presets[key]}
                </button>
              );
            })}
          </div>

          <h2 style={{ fontSize: '1.1rem' }}>{messages.reminders.reminderTimes}</h2>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>{messages.reminders.reminderHint}</p>

          <div className="reminder-list">
            {draft.map((row) => {
              const slotKey = row.slotKey as keyof typeof messages.reminders.slots;
              const label = messages.reminders.slots[slotKey] ?? row.slotKey;
              const hint = messages.reminders.slotHints[slotKey];
              return (
                <div key={row.slotKey} className="card reminder-row">
                  <div>
                    <strong>{label}</strong>
                    {hint ? <p className="hint">{hint}</p> : null}
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(e) => updateSlot(row.slotKey, { enabled: e.target.checked })}
                    />
                    {messages.reminders.enabledLabel}
                  </label>
                  <label className="field" style={{ margin: 0 }}>
                    <span className="sr-only">{messages.reminders.timeLabel}</span>
                    <input
                      type="time"
                      value={toTimeInputValue(row.localTime)}
                      disabled={!row.enabled}
                      onChange={(e) => updateSlot(row.slotKey, { localTime: e.target.value })}
                      aria-label={`${label} — ${messages.reminders.timeLabel}`}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          {saveError ? <p className="error">{saveError}</p> : null}
          {savedMessage ? <p className="success">{savedMessage}</p> : null}

          <button type="button" onClick={saveReminderTimes} disabled={savingReminders || !dirty}>
            {savingReminders ? messages.common.pleaseWait : messages.reminders.saveReminders}
          </button>
        </>
      ) : (
        !loadError && <p>{messages.common.loading}</p>
      )}
    </section>
  );
}
