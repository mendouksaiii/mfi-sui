'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, Brain, CheckCircle, Sparkle } from '@phosphor-icons/react';
import { SectionLabel } from './ui';
import { VerifyDecision } from './VerifyDecision';
import { useLiveFeed, useWalrusDecision } from '@/lib/hooks';
import { fmtUsdc, shortAddr } from '@/lib/config';

export function AuditExplorer() {
  const { data: loans } = useLiveFeed();
  const [selected, setSelected] = useState<string | null>(null);
  const active = loans.find((l) => l.loanId === selected) ?? loans[0];
  const { decision: d } = useWalrusDecision(active?.decisionBlob ?? '');

  return (
    <section id="audit" className="border-b border-line bg-ink-900/30">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24">
        <SectionLabel index="06">Verifiable underwriting · Walrus</SectionLabel>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="max-w-[20ch] text-3xl font-medium tracking-tight md:text-4xl">
            Every credit decision is auditable forever.
          </h2>
          <p className="max-w-[44ch] text-sm leading-relaxed text-fg-muted">
            The model&apos;s full reasoning and the exact telemetry it saw are written to a Walrus
            blob. The blob ID is sealed onto the on-chain loan — so anyone can replay the decision.
          </p>
        </div>

        <div className="bezel mt-12">
        <div className="bezel-core grid grid-cols-1 gap-px bg-line lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left — loan selector */}
          <div className="bg-ink-950">
            <div className="border-b border-line px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
              Recent loans
            </div>
            <ul className="divide-y divide-line">
              {loans.slice(0, 5).map((l) => {
                const on = l.loanId === active?.loanId;
                return (
                  <li key={l.loanId}>
                    <button
                      onClick={() => setSelected(l.loanId)}
                      className={`flex w-full items-center gap-3 px-5 py-4 text-left transition-colors ${
                        on ? 'bg-ink-800' : 'hover:bg-ink-900'
                      }`}
                    >
                      <span
                        className={`h-8 w-1 rounded-full transition-colors ${on ? 'bg-signal' : 'bg-transparent'}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-[13px] text-fg">{l.agent.id}</p>
                        <p className="font-mono text-[11px] text-fg-faint">
                          blob:{l.decisionBlob.slice(0, 10)}…
                        </p>
                      </div>
                      <span className="tnum text-sm text-fg-muted">${fmtUsdc(l.principal)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right — decision record */}
          <div className="bg-ink-950">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
                <Database size={13} className="text-signal" />
                walrus://{active.decisionBlob}
              </span>
              <span className="font-mono text-[11px] text-fg-faint">{d.model}</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={active?.loanId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="p-5"
              >
                {/* Verdict */}
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-md border border-repaid/30 bg-repaid/10 px-2.5 py-1 font-mono text-xs text-repaid">
                    <CheckCircle size={13} weight="fill" />
                    APPROVE
                  </span>
                  <span className="font-mono text-xs text-fg-muted">
                    confidence {(d.decision.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="ml-auto font-mono text-xs text-fg-muted">
                    trust <span className="text-signal">{d.decision.trustScore}</span>/1000
                  </span>
                </div>

                {/* Reasoning */}
                <div className="mt-5 flex items-start gap-2.5">
                  <Brain size={16} className="mt-0.5 shrink-0 text-fg-faint" />
                  <p className="text-sm leading-relaxed text-fg-muted">{d.decision.reasoning}</p>
                </div>

                {/* Telemetry the model saw */}
                <div className="mt-6">
                  <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-fg-faint">
                    <Sparkle size={12} className="text-signal-dim" />
                    On-chain telemetry snapshot
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
                    <Tele k="address" v={shortAddr(d.telemetry.address)} />
                    <Tele k="tx_count" v={String(d.telemetry.txCount)} />
                    <Tele k="reputation" v={d.telemetry.reputationLayer} accent />
                    <Tele k="sui_balance" v={d.telemetry.suiBalance} />
                    <Tele k="usdc_balance" v={d.telemetry.usdcBalance} />
                    <Tele k="owned_objects" v={String(d.telemetry.ownedObjects)} />
                  </dl>
                </div>
              </motion.div>
            </AnimatePresence>

            {active && <VerifyDecision loan={active} />}
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

function Tele({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-ink-950 px-3 py-3">
      <dt className="font-mono text-[10px] uppercase tracking-wider text-fg-faint">{k}</dt>
      <dd className={`tnum mt-1 text-sm ${accent ? 'text-signal' : 'text-fg'}`}>{v}</dd>
    </div>
  );
}
