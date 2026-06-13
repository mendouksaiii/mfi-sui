'use client';

import { WalletButton } from './WalletButton';
import { LogoMark } from './Logo';
import { StatusDot } from './ui';

const LINKS = [
  { label: 'Live Feed', href: '/app/feed' },
  { label: 'Reputation', href: '/app/reputation' },
  { label: 'Audit', href: '/app/audit' },
  { label: 'Treasury', href: '/app/treasury' },
  { label: 'Savings', href: '/app/savings' },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
        <a href="/" className="group transition-transform hover:scale-[1.03]">
          <LogoMark />
        </a>

        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-[0.18em] md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link text-fg-muted transition-colors duration-300 hover:text-signal"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg-muted sm:flex">
            <StatusDot tone="signal" />
            testnet
          </span>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
