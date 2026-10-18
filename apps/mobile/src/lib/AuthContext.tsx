import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient } from './api';
import type { TokenPair } from './api';
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from './auth';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (tokens: TokenPair) => Promise<void>;
  signOut: () => Promise<void>;
  api: ReturnType<typeof createApiClient>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const expireSession = useRef<() => Promise<void>>(async () => {});
  const api = useMemo(
    () =>
      createApiClient({
        getAccessToken,
        getRefreshToken,
        saveTokens,
        onSessionExpired: () => expireSession.current(),
      }),
    [],
  );
  expireSession.current = async () => {
    api.cancelSession();
    await clearTokens();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    getAccessToken().then((token) => {
      setIsAuthenticated(!!token);
      setIsLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    isLoading,
    signIn: async (tokens) => {
      await saveTokens(tokens);
      setIsAuthenticated(true);
    },
    signOut: async () => {
      api.cancelSession();
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        try {
          await api.logout(refreshToken);
        } catch {
          // Still clear local session if revoke fails.
        }
      }
      await clearTokens();
      setIsAuthenticated(false);
    },
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
