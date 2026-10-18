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

export type ReminderPreference = {
  slotKey: string;
  enabled: boolean;
  offsetDays: number;
  localTime: string;
};

export type FastingProfile = {
  preset: string;
  rules: Array<{ type: string; lunarDay?: number; weekday?: number }>;
  reminders: ReminderPreference[];
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

export type ApiSession = {
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  saveTokens: (tokens: TokenPair) => Promise<void>;
  /** Called when the refresh token is missing or rejected. Must clear the local session. */
  onSessionExpired: () => Promise<void>;
};

function refresh(refreshToken: string) {
  return fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((r) => parseJson<TokenPair>(r));
}

export function createApiClient(session: ApiSession) {
  let refreshInFlight: Promise<boolean> | null = null;

  async function rotateTokens(): Promise<boolean> {
    if (!refreshInFlight) {
      refreshInFlight = (async () => {
        const refreshToken = await session.getRefreshToken();
        if (!refreshToken) {
          await session.onSessionExpired();
          return false;
        }
        try {
          const tokens = await refresh(refreshToken);
          await session.saveTokens(tokens);
          return true;
        } catch {
          await session.onSessionExpired();
          return false;
        }
      })().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  }

  async function authFetch(path: string, init: RequestInit = {}, retried = false): Promise<Response> {
    const token = await session.getAccessToken();
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    if (res.status === 401 && !retried) {
      const refreshed = await rotateTokens();
      if (refreshed) return authFetch(path, init, true);
    }
    return res;
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
    refresh,
    logout: async (refreshToken: string) => {
      const res = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(
          (body as { code?: string }).code ?? 'API_ERROR',
          (body as { message?: string }).message ?? res.statusText,
          res.status,
        );
      }
    },
    me: () => authFetch('/me').then((r) => parseJson<UserProfile>(r)),
    fastingProfile: () => authFetch('/fasting/profile').then((r) => parseJson<FastingProfile>(r)),
    today: () => authFetch('/calendar/today').then((r) => parseJson<TodayStatus>(r)),
    month: (year: number, month: number) =>
      authFetch(`/calendar/month?year=${year}&month=${month}`).then((r) =>
        parseJson<MonthCalendar>(r),
      ),
    updateFastingProfile: (preset: string, customLunarDays?: number[]) =>
      authFetch('/fasting/profile', {
        method: 'PUT',
        body: JSON.stringify({ preset, customLunarDays }),
      }).then((r) => parseJson<FastingProfile>(r)),
    updateReminders: (reminders: ReminderPreference[]) =>
      authFetch('/fasting/reminders', {
        method: 'PUT',
        body: JSON.stringify({ reminders }),
      }).then((r) => parseJson<FastingProfile>(r)),
  };
}
