export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

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
  rules: Array<{ type: string; lunarDay?: number; weekday?: number }>;
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

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(body.code ?? 'API_ERROR', body.message ?? res.statusText, res.status);
  }
  return body as T;
}

export function createApiClient(getAccessToken: () => Promise<string | null>) {
  async function authFetch(path: string, init: RequestInit = {}) {
    const token = await getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${API_URL}${path}`, { ...init, headers });
  }

  return {
    register: (email: string, password: string, displayName?: string) =>
      fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      }).then((r) => parseJson<TokenPair>(r)),
    login: (email: string, password: string) =>
      fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      }).then((r) => parseJson<TokenPair>(r)),
    me: () => authFetch('/me').then((r) => parseJson<UserProfile>(r)),
    fastingProfile: () => authFetch('/fasting/profile').then((r) => parseJson<FastingProfile>(r)),
    today: () => authFetch('/calendar/today').then((r) => parseJson<TodayStatus>(r)),
    updateFastingProfile: (preset: string, customLunarDays?: number[]) =>
      authFetch('/fasting/profile', {
        method: 'PUT',
        body: JSON.stringify({ preset, customLunarDays }),
      }).then((r) => parseJson<FastingProfile>(r)),
  };
}
