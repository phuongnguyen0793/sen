import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sen — Lunar Fasting Companion',
  description: 'Never miss lunar fasting days. Reminders for the Vietnamese calendar and vegetarian recipes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
