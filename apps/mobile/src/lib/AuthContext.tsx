import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient } from './api';
import { clearTokens, getAccessToken, saveTokens } from './auth';
import type { TokenPair } from './api';

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
  const api = useMemo(() => createApiClient(getAccessToken), []);

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
