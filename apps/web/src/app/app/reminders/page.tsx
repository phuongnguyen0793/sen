'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFastingProfile, updateFastingProfile, type FastingProfile } from '@/lib/api';
import { clearTokens, getAccessToken } from '@/lib/auth';

const PRESETS = [
  { value: 'MUNG_1', label: 'Chỉ mùng 1' },
  { value: 'DAY_15', label: 'Chỉ rằm (15)' },
  { value: 'MUNG_1_AND_15', label: 'Mùng 1 và rằm' },
];

export default function RemindersPage() {
  const router = useRouter();
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
      <h1>Nhắc nhở & lịch chay</h1>
      {profile ? (
        <>
          <p>Preset hiện tại: <strong>{profile.preset}</strong></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                disabled={saving || profile.preset === p.value}
                onClick={() => changePreset(p.value)}
                style={{
                  background: profile.preset === p.value ? '#1b4332' : 'var(--green)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <h2>Giờ nhắc</h2>
          <ul>
            {profile.reminders.map((r) => (
              <li key={r.slotKey}>
                {r.slotKey}: {r.enabled ? 'bật' : 'tắt'} lúc {r.localTime}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Đang tải…</p>
      )}
      <button type="button" onClick={logout} style={{ marginTop: '2rem', background: '#c1121f' }}>
        Đăng xuất
      </button>
    </section>
  );
}
