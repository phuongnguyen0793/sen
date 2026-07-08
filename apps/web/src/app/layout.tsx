import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sen — Nhắc ăn chay âm lịch',
  description: 'Mùng 1, rằm — không bao giờ quên. Lunar fasting reminders & veg recipes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
