import type { Metadata } from 'next';
import { Fraunces, Outfit } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const display = Fraunces({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
});

const body = Outfit({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sen — Lunar Fasting Companion',
  description:
    'Never miss lunar fasting days. Reminders for the Vietnamese calendar and vegetarian recipes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
