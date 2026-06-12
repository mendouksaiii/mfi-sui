'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText } from '@phosphor-icons/react';
import { SectionLabel, TrustMeter } from './ui';
import { CreditReportModal } from './CreditReport';
import { useLeaderboard, useReportIndex } from '@/lib/hooks';
import { fmtUsdc, shortAddr } from '@/lib/config';
import type { ReportPointer } from '@/lib/chain';

export function Leaderboard() {
  const { data: LEADERBOARD } = useLeaderboard();
  const { index: reports } = useReportIndex();
  const [open, setOpen] = useState<ReportPointer | null>(null);

  return (
    <section id="leaderboard" className="border-b border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <SectionLabel index="07">Reputation registry</SectionLabel>
            <h2 className="mt-4 max-w-[20ch] text-3xl font-medium tracking-tight md:text-4xl">
              Trust, earned on-chain — not borrowed from a credit score.
            </h2>
          </div>
          <p className="max-w-[40ch] text-sm leading-relaxed text-fg-muted">
            Scores live in a shared <span className="font-mono text-fg">ReputationRegistry</span>{' '}
            object, updated on every disbursement and repayment. Each agent&apos;s full history is
            issued as a signed <span className="font-mono text-fg">credit report</span> on Walrus.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-[auto_1.4fr_1fr_0.8fr_1fr_auto] gap-4 border-b border-line pb-3 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
          <span>#</span>
          <span>Agent</span>
          <span>Trust score</span>
          <span className="text-right">Repaid</span>
          <span className="text-right">Borrowed</span>
          <span className="text-right">Report</span>
        </div>

        {/* Mount-animated for the same reason as the live feed: reputation
            rows must never depend on scroll detection to become visible. */}
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          className="divide-y divide-line"
        >
          {LEADERBOARD.map((row, i) => {
            const pointer = reports.get(row.agent.address.toLowerCase());
            return (
              <motion.li
                key={row.agent.address}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="grid grid-cols-[auto_1.4fr_1fr_0.8fr_1fr_auto] items-center gap-4 py-5"
              >
                <span className={`tnum text-lg ${i === 0 ? 'text-signal' : 'text-fg-faint'}`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-line bg-ink-900 font-mono text-[10px] text-signal">
                    {row.agent.id.split('-')[1]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm text-fg">{row.agent.id}</p>
                    <p className="font-mono text-[11px] text-fg-faint">{shortAddr(row.agent.address)}</p>
                  </div>
                </div>
                <TrustMeter score={row.trustScore} />
                <span className="tnum text-right text-sm text-fg-muted">
                  {row.loansRepaid}/{row.loansTaken}
                </span>
                <span className="tnum text-right text-sm text-fg">
                  <span className="text-fg-faint">$</span>
                  {fmtUsdc(row.totalBorrowed)}
                </span>
                <span className="text-right">
                  {pointer ? (
                    <button
                      onClick={() => setOpen(pointer)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-signal/35 bg-signal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-signal transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-signal/20 hover:shadow-[0_0_18px_rgba(0,245,255,0.25)] active:scale-95"
                    >
                      <FileText size={13} /> view
                    </button>
                  ) : (
                    <span className="font-mono text-[11px] text-fg-faint">—</span>
                  )}
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>

      {open && <CreditReportModal pointer={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
