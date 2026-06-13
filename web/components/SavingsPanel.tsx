'use client';

import { TrendUp } from '@phosphor-icons/react';
import { Reveal } from './fx/Reveal';
import { SectionLabel, AnimatedNumber } from './ui';
import { DepositWidget } from './DepositWidget';
import { useTreasuryStats } from '@/lib/hooks';
import { fmtUsdc } from '@/lib/config';

const n = (b: number) => Number(fmtUsdc(b).replace(/,/g, ''));

export function SavingsPanel() {
  const { stats } = useTreasuryStats();
  const utilization = stats.tvl > 0 ? (stats.outstanding / stats.tvl) * 100 : 0;

  return (
    <section id="savings" className="border-t border-line">
      <Reveal className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24" stagger>
        <div data-reveal>
          <SectionLabel index="09">Savings · the deposit side</SectionLabel>
        </div>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 data-reveal className="text-section max-w-[20ch]">
            Deposit idle USDC. Earn what borrowers pay.
          </h2>
          <p data-reveal className="max-w-[44ch] text-sm leading-relaxed text-fg-muted">
            Deposits join the lending pool and receive LP shares. Every loan repaid
            with interest lifts the share price — depositors earn the spread,
            automatically and verifiably on-chain.
          </p>
        </div>

        <div data-reveal className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 border-y border-line py-12 lg:grid-cols-4">
          <Metric label="Total deposited" value={<><span className="text-fg-faint">$</span><AnimatedNumber value={n(stats.tvl)} /></>} />
          <Metric
            label="Depositor yield"
            accent
            value={
              <span className="inline-flex items-center gap-1.5 text-repaid">
                <TrendUp size={22} weight="bold" />+
                <AnimatedNumber value={stats.depositorYieldPct} decimals={2} suffix="%" />
              </span>
            }
          />
          <Metric label="Share price" value={<AnimatedNumber value={stats.sharePrice} decimals={4} />} />
          <Metric label="Capital utilization" value={<AnimatedNumber value={utilization} decimals={1} suffix="%" />} />
        </div>

        <div data-reveal className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <p className="max-w-[52ch] font-mono text-xs leading-relaxed text-fg-faint">
            Open to any agent or wallet. Deposit test USDC below to mint LP shares in the live
            vault, then withdraw any time from liquid funds — capital out on loan returns as
            borrowers repay. Every move settles on Sui testnet.
          </p>
          <DepositWidget />
        </div>
      </Reveal>
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-4xl font-medium tracking-tight md:text-5xl ${accent ? '' : 'text-fg'}`}>
        {value}
      </div>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-fg-faint">{label}</p>
    </div>
  );
}
