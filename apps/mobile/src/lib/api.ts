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

export type CheckInStatus = 'DONE' | 'MISSED' | 'N_A';

export type CheckIn = {
  localDate: string;
  status: CheckInStatus;
  note: string | null;
  updatedAt: string;
};

export type Streak = { current: number; best: number };

export type RecipeSummary = {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  cookMinutes: number;
  servings: number;
  tags: string[];
  noOnionGarlic: boolean;
  source: string;
  bookmarked: boolean;
};

export type RecipeDetail = RecipeSummary & {
  ingredients: Array<{ vi: string; en: string }>;
  steps: Array<{ vi: string; en: string }>;
  disclaimer: string;
};

export type AiQuota = { limit: number; used: number; remaining: number };

export type UpcomingDay = {
  solarDate: string;
  lunar: { day: number; month: number; year: number; leapMonth: boolean };
  daysUntil: number;
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
    public fallbackRecipeIds: string[] = [],
  ) {
    super(message);
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      body.code ?? 'API_ERROR',
      body.message ?? res.statusText,
      res.status,
      Array.isArray(body.fallbackRecipeIds) ? body.fallbackRecipeIds : [],
    );
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
  let sessionGeneration = 0;

  function cancelSession() {
    sessionGeneration += 1;
  }

  async function rotateTokens(): Promise<boolean> {
    if (!refreshInFlight) {
      const generation = sessionGeneration;
      refreshInFlight = (async () => {
        const refreshToken = await session.getRefreshToken();
        if (!refreshToken || generation !== sessionGeneration) {
          if (!refreshToken) await session.onSessionExpired();
          return false;
        }
        try {
          const tokens = await refresh(refreshToken);
          if (generation !== sessionGeneration) return false;
          await session.saveTokens(tokens);
          if (generation !== sessionGeneration) {
            await session.onSessionExpired();
            return false;
          }
          return true;
        } catch {
          if (generation === sessionGeneration) await session.onSessionExpired();
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
    cancelSession,
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
    updateMe: (patch: Partial<Pick<UserProfile, 'displayName' | 'timezone' | 'locale' | 'preferNoOnionGarlic'>>) =>
      authFetch('/me', { method: 'PATCH', body: JSON.stringify(patch) }).then((r) => parseJson<UserProfile>(r)),
    deleteMe: async () => {
      const res = await authFetch('/me', { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(
          (body as { code?: string }).code ?? 'API_ERROR',
          (body as { message?: string }).message ?? res.statusText,
          res.status,
        );
      }
    },
    fastingProfile: () => authFetch('/fasting/profile').then((r) => parseJson<FastingProfile>(r)),
    today: () => authFetch('/calendar/today').then((r) => parseJson<TodayStatus>(r)),
    upcoming: (days = 30) =>
      authFetch(`/calendar/upcoming?days=${days}`).then((r) => parseJson<{ days: UpcomingDay[] }>(r)),
    checkIns: (from: string, to: string) =>
      authFetch(`/check-ins?from=${from}&to=${to}`).then((r) => parseJson<CheckIn[]>(r)),
    upsertCheckIn: (localDate: string, status: CheckInStatus) =>
      authFetch(`/check-ins/${localDate}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }).then((r) => parseJson<CheckIn>(r)),
    streak: () => authFetch('/stats/streak').then((r) => parseJson<Streak>(r)),
    recipes: (params?: { tag?: string; bookmarked?: boolean; noOnion?: boolean }) => {
      const query = new URLSearchParams();
      if (params?.tag) query.set('tag', params.tag);
      if (params?.bookmarked) query.set('bookmarked', 'true');
      if (params?.noOnion) query.set('noOnion', 'true');
      const suffix = query.toString() ? `?${query}` : '';
      return authFetch(`/recipes${suffix}`).then((r) => parseJson<RecipeSummary[]>(r));
    },
    recipe: (id: string) => authFetch(`/recipes/${id}`).then((r) => parseJson<RecipeDetail>(r)),
    bookmarkRecipe: (id: string) =>
      authFetch(`/recipes/${id}/bookmark`, { method: 'POST' }).then((r) => parseJson<RecipeDetail>(r)),
    unbookmarkRecipe: async (id: string) => {
      const res = await authFetch(`/recipes/${id}/bookmark`, { method: 'DELETE' });
      if (!res.ok) await parseJson(res);
    },
    aiQuota: () => authFetch('/ai/quota').then((r) => parseJson<AiQuota>(r)),
    suggestRecipe: (prompt?: string) =>
      authFetch('/ai/recipes', { method: 'POST', body: JSON.stringify({ prompt }) }).then((r) =>
        parseJson<RecipeDetail>(r),
      ),
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
