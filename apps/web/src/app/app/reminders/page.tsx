'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { fetchFastingProfile, updateFastingProfile, type FastingProfile } from '@/lib/api';
import { clearTokens, getAccessToken } from '@/lib/auth';

const PRESET_KEYS = ['MUNG_1', 'DAY_15', 'MUNG_1_AND_15'] as const;

export default function RemindersPage() {
  const router = useRouter();
  const { messages } = useI18n();
  const [profile, setProfile] = useState<FastingProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchFastingProfile(token).then(setProfile);
  }, [router]);

  async function changePreset(preset: string) {
    const token = getAccessToken();
    if (!token) return;
    setSaving(true);
    try {
      setProfile(await updateFastingProfile(token, preset));
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearTokens();
    router.push('/login');
  }

  return (
    <section>
      <h1>{messages.reminders.title}</h1>
      {profile ? (
        <>
          <p>
            {messages.reminders.currentPreset}: <strong>{profile.preset}</strong>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {PRESET_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={saving || profile.preset === key}
                onClick={() => changePreset(key)}
                style={{
                  background: profile.preset === key ? '#1b4332' : 'var(--green)',
                }}
              >
                {messages.reminders.presets[key]}
              </button>
            ))}
          </div>
          <h2>{messages.reminders.reminderTimes}</h2>
          <ul>
            {profile.reminders.map((r) => {
              const slotLabel =
                messages.reminders.slots[r.slotKey as keyof typeof messages.reminders.slots] ??
                r.slotKey;
              return (
                <li key={r.slotKey}>
                  {slotLabel}: {r.enabled ? messages.common.on : messages.common.off}{' '}
                  {messages.common.at} {r.localTime}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p>{messages.common.loading}</p>
      )}
      <button type="button" onClick={logout} style={{ marginTop: '2rem', background: '#c1121f' }}>
        {messages.common.signOut}
      </button>
    </section>
  );
}
