export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api/proxy';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
};

export type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  timezone: string;
  locale: string;
  preferNoOnionGarlic: boolean;
};

export type FastingProfile = {
  preset: string;
  rules: Array<{ type: string; lunarDay?: number }>;
  reminders: Array<{
    slotKey: string;
    enabled: boolean;
    offsetDays: number;
    localTime: string;
  }>;
  updatedAt: string;
};

export type TodayStatus = {
  solarDate: string;
  lunar: { day: number; month: number; year: number; leapMonth: boolean };
  isFasting: boolean;
  label: string | null;
};

export type MonthCalendar = {
  year: number;
  month: number;
  days: Array<{
    solarDate: string;
    lunar: { day: number; month: number; year: number; leapMonth: boolean };
    isFasting: boolean;
    isToday: boolean;
  }>;
};

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.message ?? res.statusText);
  }
  return body as T;
}

export async function register(email: string, password: string, displayName?: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  return parseJson<TokenPair>(res);
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return parseJson<TokenPair>(res);
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export async function fetchMe(token: string) {
  const res = await fetch(`${API_URL}/me`, { headers: authHeaders(token) });
  return parseJson<UserProfile>(res);
}

export async function fetchToday(token: string) {
  const res = await fetch(`${API_URL}/calendar/today`, { headers: authHeaders(token) });
  return parseJson<TodayStatus>(res);
}

export async function fetchMonth(token: string, year: number, month: number) {
  const res = await fetch(`${API_URL}/calendar/month?year=${year}&month=${month}`, {
    headers: authHeaders(token),
  });
  return parseJson<MonthCalendar>(res);
}

export async function fetchFastingProfile(token: string) {
  const res = await fetch(`${API_URL}/fasting/profile`, { headers: authHeaders(token) });
  return parseJson<FastingProfile>(res);
}

export async function updateFastingProfile(token: string, preset: string) {
  const res = await fetch(`${API_URL}/fasting/profile`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ preset }),
  });
  return parseJson<FastingProfile>(res);
}
