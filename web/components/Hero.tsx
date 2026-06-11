'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Lightning } from '@phosphor-icons/react';
import { AnimatedNumber, StatusDot } from './ui';
import { TREASURY_STATE, LIVE_FEED } from '@/lib/mock';
import { fmtUsdc, shortAddr } from '@/lib/config';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-grid">
      <div className="absolute inset-0 bg-radial-fade" />
      <div className="relative mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-5 pb-20 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pb-28 lg:pt-28">
        {/* Left — message */}
        <div className="flex flex-col justify-center">
          <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900/60 px-3 py-1 font-mono text-xs text-fg-muted">
              <StatusDot tone="signal" />
              Sui Overflow 2026 · Agentic Web × Walrus
            </span>
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-[14ch] text-balance text-5xl font-medium leading-[0.95] tracking-tightest md:text-6xl lg:text-[4.4rem]"
          >
            Autonomous credit for the{' '}
            <span className="text-signal">agent economy</span>.
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-[54ch] text-base leading-relaxed text-fg-muted"
          >
            M-Fi is an autonomous credit bureau on Sui. An LLM underwrites loan
            requests from AI agents against live on-chain telemetry, records the
            full decision to Walrus, and disburses USDC in a single programmable
            transaction. No humans. No forms. No identity.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <a
              href="#feed"
              className="group inline-flex items-center gap-2 rounded-lg bg-signal px-5 py-3 text-sm font-medium text-ink-950 transition-transform active:scale-[0.98]"
            >
              Watch agents borrow
              <ArrowRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#audit"
              className="inline-flex items-center gap-2 rounded-lg border border-line-strong px-5 py-3 text-sm text-fg transition-colors hover:border-signal/40 active:scale-[0.98]"
            >
              Inspect a decision
            </a>
          </motion.div>

          {/* Inline metric row — hairlines, no cards */}
          <motion.dl
            custom={4}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-12 grid grid-cols-3 divide-x divide-line border-y border-line"
          >
            <Metric label="Liquid treasury" value={<><span className="text-fg-faint">$</span><AnimatedNumber value={Number(fmtUsdc(TREASURY_STATE.liquid).replace(/,/g, ''))} decimals={0} /></>} />
            <Metric label="Total disbursed" value={<><span className="text-fg-faint">$</span><AnimatedNumber value={Number(fmtUsdc(TREASURY_STATE.totalDisbursed).replace(/,/g, ''))} decimals={0} /></>} pad />
            <Metric label="Active loans" value={<AnimatedNumber value={TREASURY_STATE.activeLoans} />} pad />
          </motion.dl>
        </div>

        {/* Right — agent control panel */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="overflow-hidden rounded-xl border border-line-strong bg-ink-900/80 shadow-diffuse backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="flex items-center gap-2 font-mono text-xs text-fg-muted">
                <Lightning size={13} weight="fill" className="text-signal" />
                underwriter.live
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg-faint">
                <StatusDot tone="repaid" /> streaming
              </span>
            </div>
            <div className="divide-y divide-line">
              {LIVE_FEED.slice(0, 4).map((l, i) => (
                <motion.div
                  key={l.loanId}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-ink-800/50"
                >
                  <span className="font-mono text-[11px] text-fg-faint">{shortAddr(l.agent.address, 6, 4)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] text-fg">{l.agent.id}</p>
                  </div>
                  <span className="tnum text-sm text-fg">${fmtUsdc(l.principal)}</span>
                  <span
                    className={`font-mono text-[10px] tracking-wider ${
                      l.status === 'REPAID' ? 'text-repaid' : l.status === 'ACTIVE' ? 'text-active' : 'text-denied'
                    }`}
                  >
                    {l.status === 'DEFAULTED' ? 'DENIED' : l.status}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="border-t border-line bg-ink-950/40 px-4 py-2.5">
              <p className="font-mono text-[11px] text-fg-faint">
                <span className="text-signal-dim">›</span> every decision signed + stored on Walrus
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Metric({ label, value, pad }: { label: string; value: React.ReactNode; pad?: boolean }) {
  return (
    <div className={`py-4 ${pad ? 'pl-5' : 'pr-5'}`}>
      <dd className="text-2xl font-medium tracking-tight">{value}</dd>
      <dt className="mt-1 font-mono text-[11px] uppercase tracking-wider text-fg-faint">{label}</dt>
    </div>
  );
}
