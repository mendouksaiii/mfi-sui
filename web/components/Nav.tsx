'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react';
import { WalletButton } from './WalletButton';
import { LogoMark } from './Logo';
import { StatusDot } from './ui';

/**
 * Brand bar. Section navigation lives in the dashboard tab bar (AppTabs), not
 * here — so the portal stays clean and the dashboard doesn't show the section
 * links twice. On the landing we surface a single "Open app" entry point.
 */
export function Nav() {
  const path = usePathname() ?? '/';
  const onLanding = path === '/' || path === '';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 lg:px-8">
        <a href="/" className="group transition-transform hover:scale-[1.03]">
          <LogoMark />
        </a>

        <div className="flex items-center gap-4">
          <span className="hidden items-center gap-2 font-mono text-xs uppercase tracking-widest text-fg-muted sm:flex">
            <StatusDot tone="signal" />
            testnet
          </span>
          {onLanding && (
            <Link
              href="/app"
              className="nav-link hidden items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-fg-muted transition-colors duration-300 hover:text-signal sm:flex"
            >
              Open app
              <ArrowRight size={13} weight="bold" />
            </Link>
          )}
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
