'use client';

import { AuthProvider } from '@/lib/AuthProvider';
import { I18nProvider } from '@/lib/i18n/I18nProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  );
}
