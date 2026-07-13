import type { TokenPair } from './api';

const ACCESS = 'sen.access';
const REFRESH = 'sen.refresh';

/** Fired on the same tab when tokens change (storage events cover other tabs). */
export const AUTH_CHANGED_EVENT = 'sen:auth-changed';

function notifyAuthChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function saveTokens(tokens: TokenPair) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
  notifyAuthChanged();
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  notifyAuthChanged();
}
