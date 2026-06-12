'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from '@phosphor-icons/react';
import { SectionLabel, StatusTag, TrustMeter } from './ui';
import { useLiveFeed } from '@/lib/hooks';
import { fmtUsdc, shortAddr, MFI } from '@/lib/config';

export function LiveFeed() {
  const { data: feed } = useLiveFeed();
  return (
    <section id="feed" className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="05">Live lending feed</SectionLabel>
            <h2 className="mt-4 max-w-[18ch] text-3xl font-medium tracking-tight md:text-4xl">
              Autonomous agents, borrowing in real time.
            </h2>
          </div>
          <p className="max-w-[42ch] text-sm leading-relaxed text-fg-muted">
            Each row is an on-chain <span className="font-mono text-fg">LoanDisbursed</span> or{' '}
            <span className="font-mono text-fg">LoanRepaid</span> event, emitted by the underwriter
            module and streamed straight from the Sui fullnode.
          </p>
        </div>

        {/* Column header */}
        <div className="mt-12 hidden grid-cols-[1.4fr_1.6fr_0.8fr_0.7fr_1fr_auto] gap-4 border-b border-line pb-3 font-mono text-[11px] uppercase tracking-wider text-fg-faint lg:grid">
          <span>Agent</span>
          <span>Purpose</span>
          <span className="text-right">Principal</span>
          <span className="text-right">APY</span>
          <span>Trust</span>
          <span className="text-right">Status</span>
        </div>

        {/* Animate on mount, not on scroll — in-view detection proved
            unreliable in the static production build, and the live feed must
            never be able to render invisible. */}
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.07 } } }}
          className="divide-y divide-line"
        >
          {feed.map((l) => (
            <motion.li
              key={l.loanId}
              variants={{
                hidden: { opacity: 0, y: 14 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group -mx-3 grid grid-cols-1 gap-2 rounded-md px-3 py-5 transition-[background-color,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:translate-x-1 hover:bg-signal/[0.035] lg:grid-cols-[1.4fr_1.6fr_0.8fr_0.7fr_1fr_auto] lg:items-center lg:gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-ink-900 font-mono text-[10px] text-signal">
                  {l.agent.id.split('-')[1]}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-fg">{l.agent.id}</p>
                  <p className="font-mono text-[11px] text-fg-faint">{shortAddr(l.agent.address)}</p>
                </div>
              </div>

              <p className="truncate text-sm text-fg-muted">{l.purpose}</p>

              <span className="tnum text-sm text-fg lg:text-right">
                <span className="text-fg-faint">$</span>
                {fmtUsdc(l.principal)}
              </span>

              <span className="tnum text-sm text-fg-muted lg:text-right">
                {l.apyBps === 0 ? '—' : `${(l.apyBps / 100).toFixed(0)}%`}
              </span>

              <TrustMeter score={l.trustScore} />

              <div className="flex items-center justify-between gap-4 lg:justify-end">
                <StatusTag status={l.status} />
                <a
                  href={`${MFI.explorer}/object/${l.loanId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-fg-faint opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="View on explorer"
                >
                  <ArrowUpRight size={15} />
                </a>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
