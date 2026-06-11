'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, ShieldWarning, ArrowUpRight, CircleNotch, Fingerprint } from '@phosphor-icons/react';
import { verifyDecision, type VerifyResult } from '@/lib/verify';
import { MFI } from '@/lib/config';
import type { LoanEvent } from '@/lib/mock';

type Phase = 'idle' | 'running' | 'done';

/** One-click, fully client-side proof that an underwriting decision is
 *  tamper-proof: available on Walrus, signed by the underwriter key, and in
 *  agreement with the on-chain loan terms. */
export function VerifyDecision({ loan }: { loan: LoanEvent }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<VerifyResult | null>(null);

  async function run() {
    setPhase('running');
    setResult(null);
    const [r] = await Promise.all([
      verifyDecision(loan),
      new Promise((res) => setTimeout(res, 900)), // let the checks read as work
    ]);
    setResult(r);
    setPhase('done');
  }

  return (
    <div className="border-t border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <button
          onClick={run}
          disabled={phase === 'running'}
          className="inline-flex items-center gap-2 rounded-md border border-signal/40 bg-signal/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-signal transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-signal/20 hover:shadow-[0_0_18px_rgba(0,245,255,0.25)] active:scale-95 disabled:opacity-60"
        >
          {phase === 'running' ? (
            <CircleNotch size={14} className="animate-spin" />
          ) : (
            <Fingerprint size={14} />
          )}
          {phase === 'running' ? 'Verifying' : 'Verify this decision'}
        </button>
        <a
          href={`${MFI.walrusAggregator}/v1/blobs/${loan.decisionBlob}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] text-fg-faint transition-colors hover:text-signal"
        >
          view raw blob <ArrowUpRight size={12} weight="bold" />
        </a>
      </div>

      <AnimatePresence>
        {phase === 'done' && result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <ul className="divide-y divide-line border-t border-line">
              {result.steps.map((s, i) => (
                <motion.li
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.18, duration: 0.35 }}
                  className="flex items-start gap-3 px-5 py-3"
                >
                  {s.ok ? (
                    <ShieldCheck size={16} weight="fill" className="mt-0.5 shrink-0 text-repaid" />
                  ) : (
                    <ShieldWarning size={16} weight="fill" className="mt-0.5 shrink-0 text-denied" />
                  )}
                  <div className="min-w-0">
                    <p className={`font-mono text-xs uppercase tracking-wider ${s.ok ? 'text-fg' : 'text-denied'}`}>
                      {s.label}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-fg-faint">{s.detail}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: result.steps.length * 0.18 + 0.1 }}
              className={`flex items-center gap-2 border-t px-5 py-3 font-mono text-xs uppercase tracking-[0.2em] ${
                result.allOk ? 'border-repaid/30 bg-repaid/5 text-repaid' : 'border-denied/30 bg-denied/5 text-denied'
              }`}
            >
              {result.allOk ? <ShieldCheck size={14} weight="fill" /> : <ShieldWarning size={14} weight="fill" />}
              {result.allOk
                ? 'Tamper-proof — content-addressed, signed, chain-pinned'
                : 'Verification incomplete — see failed checks'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
