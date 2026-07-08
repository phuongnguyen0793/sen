'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/app', label: 'Today' },
  { href: '/app/calendar', label: 'Calendar' },
  { href: '/app/reminders', label: 'Reminders' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '1.25rem', color: 'var(--green)' }}>Sen</strong>
        <Link href="/">Home</Link>
      </header>
      <nav className="nav">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            style={{ fontWeight: pathname === l.href ? 700 : 400 }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
