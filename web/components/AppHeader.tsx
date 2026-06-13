'use client';

import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react';
import { AnimatedNumber, StatusDot } from './ui';
import { WalletButton } from './WalletButton';
import { useTreasuryStats } from '@/lib/hooks';
import { fmtUsdc } from '@/lib/config';

const n = (b: number) => Number(fmtUsdc(b).replace(/,/g, ''));

export function AppHeader() {
  const { stats: t, isLive } = useTreasuryStats();
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-5 pb-12 pt-12 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted transition-colors hover:text-fg">
            <ArrowLeft size={14} /> back to portal
          </Link>
          <span className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted">
            <StatusDot tone={isLive ? 'repaid' : 'signal'} />
            {isLive ? 'live on-chain · Sui testnet' : 'underwriter online · Sui testnet'}
          </span>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-section max-w-[16ch]">
              The underwriter, <span className="text-signal">live</span>.
            </h1>
            <p className="mt-4 max-w-[52ch] text-sm leading-relaxed text-fg-muted">
              Real-time view of the M-Fi protocol on-chain: agent loans, verifiable
              Walrus decisions, reputation, and the yield-bearing treasury.
            </p>
          </div>
          <WalletButton />
        </div>

        <dl className="mt-12 grid grid-cols-2 divide-line border-y border-line sm:grid-cols-4 sm:divide-x">
          <Stat label="Liquid treasury" value={n(t.liquid)} prefix="$" />
          <Stat label="Total disbursed" value={n(t.totalDisbursed)} prefix="$" pad />
          <Stat label="Repayment rate" value={(t.totalRepaid / t.totalDisbursed) * 100} suffix="%" decimals={1} pad />
          <Stat label="Active loans" value={t.activeLoans} pad />
        </dl>
      </div>
    </section>
  );
}

function Stat({ label, value, prefix = '', suffix = '', decimals = 0, pad }: { label: string; value: number; prefix?: string; suffix?: string; decimals?: number; pad?: boolean }) {
  return (
    <div className={`py-5 ${pad ? 'sm:pl-5' : 'sm:pr-5'}`}>
      <dd className="text-2xl font-medium tracking-tight md:text-3xl">
        <span className="text-white/45">{prefix}</span>
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </dd>
      <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-white/55">{label}</dt>
    </div>
  );
}
