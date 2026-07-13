'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { logout as logoutRequest } from './api';
import type { TokenPair } from './api';
import {
  AUTH_CHANGED_EVENT,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from './auth';

type AuthContextValue = {
  /** False until localStorage has been read on the client. */
  isReady: boolean;
  isAuthenticated: boolean;
  getAccessToken: () => string | null;
  signIn: (tokens: TokenPair) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthenticated() {
  return !!getAccessToken();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const syncFromStorage = useCallback(() => {
    setIsAuthenticated(readAuthenticated());
    setIsReady(true);
  }, []);

  useEffect(() => {
    syncFromStorage();

    const onAuthChanged = () => setIsAuthenticated(readAuthenticated());
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'sen.access' || event.key === 'sen.refresh' || event.key === null) {
        setIsAuthenticated(readAuthenticated());
      }
    };

    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncFromStorage]);

  const signIn = useCallback((tokens: TokenPair) => {
    saveTokens(tokens);
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken);
      } catch {
        // Still clear local session if revoke fails (expired/already revoked).
      }
    }
    clearTokens();
    setIsAuthenticated(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isReady,
      isAuthenticated,
      getAccessToken,
      signIn,
      signOut,
    }),
    [isReady, isAuthenticated, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
