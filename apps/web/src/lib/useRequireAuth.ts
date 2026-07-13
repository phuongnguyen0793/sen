'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/** Redirects to /login when the session is missing. Returns auth helpers when ready. */
export function useRequireAuth() {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (auth.isReady && !auth.isAuthenticated) {
      router.replace('/login');
    }
  }, [auth.isReady, auth.isAuthenticated, router]);

  return auth;
}
