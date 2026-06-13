'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '/app' },
  { label: 'Live Feed', href: '/app/feed' },
  { label: 'Reputation', href: '/app/reputation' },
  { label: 'Audit', href: '/app/audit' },
  { label: 'Treasury', href: '/app/treasury' },
  { label: 'Savings', href: '/app/savings' },
];

/** Sticky secondary nav for the dashboard — each tab is its own route. */
export function AppTabs() {
  const raw = usePathname() ?? '/app';
  const path = raw.replace(/\/$/, '') || '/app';

  return (
    <div className="sticky top-16 z-40 border-b border-line bg-ink-950/85 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-5 lg:px-8">
        {TABS.map((t) => {
          const active = t.href === '/app' ? path === '/app' : path === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className={`relative whitespace-nowrap px-4 py-3.5 font-mono text-xs uppercase tracking-[0.18em] transition-colors duration-300 ${
                active ? 'text-signal' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {t.label}
              <span
                className={`absolute inset-x-3 bottom-0 h-px transition-transform duration-300 ${
                  active ? 'scale-x-100 bg-signal shadow-[0_0_8px_#00f5ff]' : 'scale-x-0 bg-signal'
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
