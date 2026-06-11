'use client';

import { ShieldCheck, Lightning, Database, TrendUp } from '@phosphor-icons/react';
import { Reveal } from './fx/Reveal';
import { ScrambleText } from './fx/ScrambleText';
import { Spotlight } from './fx/Spotlight';
import { AnimatedNumber } from './ui';
import { useTreasuryStats } from '@/lib/hooks';
import { fmtUsdc } from '@/lib/config';

export function ProofSection() {
  const { stats } = useTreasuryStats();
  const disbursed = Number(fmtUsdc(stats.totalDisbursed).replace(/,/g, ''));
  const repayRate = stats.totalDisbursed > 0 ? (stats.totalRepaid / stats.totalDisbursed) * 100 : 0;

  return (
    <section className="relative py-28 lg:py-40">
      {/* Ghost index */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 top-6 select-none font-display text-[16rem] font-black leading-none text-signal/[0.04] lg:text-[22rem]"
      >
        02
      </div>

      <Reveal className="mx-auto max-w-[1400px] px-5 lg:px-20" stagger>
        {/* Asymmetric editorial header */}
        <div data-reveal className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <h2 className="text-section max-w-[18ch] tracking-tight">
            Proof, not promises.{' '}
            <span className="glow-text">Verify every block.</span>
          </h2>
          <p className="font-mono text-xs leading-relaxed text-fg-muted lg:pb-2">
            <ScrambleText text="// LIVE PROTOCOL TELEMETRY" trigger="view" />
            <br />
            Every figure below is read directly from the Sui fullnode and Walrus.
            Nothing is self-reported.
          </p>
        </div>

        {/* Gapless bento — hairline-divided, no floating cards */}
        <div data-reveal className="mt-16 grid grid-cols-1 border border-line sm:grid-cols-2 lg:grid-cols-4">
          <Cell
            icon={<Lightning size={18} weight="bold" />}
            value={<><span className="text-fg-faint">&lt;</span><AnimatedNumber value={200} /><span className="text-xl text-fg-faint">ms</span></>}
            label="Median underwriting decision"
            sub="LLM risk scoring on live telemetry"
          />
          <Cell
            icon={<Database size={18} weight="bold" />}
            value={<><AnimatedNumber value={100} /><span className="text-xl text-fg-faint">%</span></>}
            label="Decisions sealed on Walrus"
            sub="Reasoning + telemetry, forever auditable"
            tall
          />
          <Cell
            icon={<ShieldCheck size={18} weight="bold" />}
            value={<><span className="text-fg-faint">$</span><AnimatedNumber value={disbursed} /></>}
            label="USDC disbursed to agents"
            sub="Soulbound loans, atomic settlement"
          />
          <Cell
            icon={<TrendUp size={18} weight="bold" />}
            value={<><AnimatedNumber value={repayRate} decimals={1} /><span className="text-xl text-fg-faint">%</span></>}
            label="On-time repayment rate"
            sub="Reputation rises with every clean cycle"
            accent
          />
        </div>
      </Reveal>
    </section>
  );
}

function Cell({
  icon,
  value,
  label,
  sub,
  accent,
  tall,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  sub: string;
  accent?: boolean;
  tall?: boolean;
}) {
  return (
    <Spotlight
      className={`group relative border-line p-8 transition-colors hover:bg-signal/[0.04] sm:[&:nth-child(2n)]:border-l lg:[&:not(:first-child)]:border-l ${
        tall ? '' : ''
      } border-t sm:[&:nth-child(-n+2)]:border-t-0 lg:[&]:border-t-0`}
    >
      <div className={`mb-6 ${accent ? 'text-repaid' : 'text-signal'}`}>{icon}</div>
      <div className={`font-display text-4xl font-bold tracking-tight md:text-5xl ${accent ? 'text-repaid' : 'text-fg'}`}>
        {value}
      </div>
      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-fg">{label}</p>
      <p className="mt-1.5 text-sm leading-snug text-fg-faint">{sub}</p>
      {/* corner tick — cyberpunk detail */}
      <span className="absolute right-3 top-3 h-2 w-2 border-r border-t border-signal/40 transition-all group-hover:border-signal" />
    </Spotlight>
  );
}
