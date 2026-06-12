'use client';

import { motion } from 'framer-motion';
import { TrendUp, Vault, ArrowsClockwise } from '@phosphor-icons/react';
import { Spotlight } from './fx/Spotlight';
import { AnimatedNumber, SectionLabel } from './ui';
import { useTreasuryStats } from '@/lib/hooks';
import { fmtUsdc } from '@/lib/config';

const n = (base: number) => Number(fmtUsdc(base).replace(/,/g, ''));

export function TreasuryPanel() {
  const { stats, deployedScallop, scallopApyBps } = useTreasuryStats();
  const t = { ...stats, deployedScallop, scallopApyBps };
  const utilisation = (t.deployedScallop / (t.liquid + t.deployedScallop)) * 100;

  return (
    <section id="treasury" className="border-b border-line bg-ink-900/30">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24">
        <SectionLabel index="08">Yield-bearing treasury</SectionLabel>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-medium tracking-tight md:text-4xl">
            Idle capital never sleeps.
          </h2>
          <p className="max-w-[44ch] text-sm leading-relaxed text-fg-muted">
            Capital not on loan is supplied to <span className="font-mono text-fg">Scallop</span> for
            yield, then withdrawn just-in-time when an agent draws down. One treasury, two jobs.
          </p>
        </div>

        {/* Bento — asymmetric, hairline-bordered */}
        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          {/* Wide — allocation bar */}
          <Spotlight className="rounded-xl border border-line-strong bg-ink-950 p-7 shadow-inset-edge">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
              <Vault size={14} className="text-signal" /> Treasury allocation
            </div>
            <div className="mt-6 text-4xl font-medium tracking-tight">
              <span className="text-fg-faint">$</span>
              <AnimatedNumber value={n(t.liquid + t.deployedScallop)} decimals={0} />
            </div>
            <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-ink-700">
              <motion.div
                className="bg-signal"
                initial={{ width: 0 }}
                animate={{ width: `${100 - utilisation}%` }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.div
                className="bg-signal-dim"
                initial={{ width: 0 }}
                animate={{ width: `${utilisation}%` }}
                transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="mt-4 flex justify-between font-mono text-xs">
              <span className="flex items-center gap-2 text-fg-muted">
                <span className="h-2 w-2 rounded-full bg-signal" /> Liquid · ${fmtUsdc(t.liquid)}
              </span>
              <span className="flex items-center gap-2 text-fg-muted">
                <span className="h-2 w-2 rounded-full bg-signal-dim" /> Scallop · ${fmtUsdc(t.deployedScallop)}
              </span>
            </div>
          </Spotlight>

          {/* APY */}
          <Spotlight className="flex flex-col justify-between rounded-xl border border-line-strong bg-ink-950 p-7 shadow-inset-edge">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
              <TrendUp size={14} className="text-repaid" /> Scallop APY
            </div>
            <div className="mt-6">
              <span className="text-4xl font-medium tracking-tight text-repaid">
                <AnimatedNumber value={t.scallopApyBps / 100} decimals={2} suffix="%" />
              </span>
              <p className="mt-2 font-mono text-xs text-fg-faint">supplying mUSDC · auto-compounded</p>
            </div>
          </Spotlight>

          {/* Repayment ratio */}
          <Spotlight className="flex flex-col justify-between rounded-xl border border-line-strong bg-ink-950 p-7 shadow-inset-edge">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
              <ArrowsClockwise size={14} className="text-signal" /> Repayment rate
            </div>
            <div className="mt-6">
              <span className="text-4xl font-medium tracking-tight">
                <AnimatedNumber value={(t.totalRepaid / t.totalDisbursed) * 100} decimals={1} suffix="%" />
              </span>
              <p className="mt-2 font-mono text-xs text-fg-faint">
                ${fmtUsdc(t.totalRepaid)} / ${fmtUsdc(t.totalDisbursed)}
              </p>
            </div>
          </Spotlight>
        </div>
      </div>
    </section>
  );
}
