import type { TokenPair } from './api';

const ACCESS = 'sen.access';
const REFRESH = 'sen.refresh';

export function saveTokens(tokens: TokenPair) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS, tokens.accessToken);
  localStorage.setItem(REFRESH, tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS);
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
}
