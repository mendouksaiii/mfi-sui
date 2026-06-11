'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  SealCheck,
  ShieldWarning,
  ArrowUpRight,
  FileText,
  CircleNotch,
} from '@phosphor-icons/react';
import { MFI, shortAddr } from '@/lib/config';
import { verifyAttestation } from '@/lib/verify';
import type { ReportPointer } from '@/lib/chain';

interface ReportBlob {
  generatedAt: string;
  bureau: string;
  agent: { address: string; handle: string; job: string };
  standing: {
    trustScore: number;
    loansTaken: number;
    loansRepaid: number;
    repaymentRatePct: number;
    totalBorrowedUsdc: number;
  };
  history: Array<{ at: string; trustScore: number; loansRepaid: number }>;
  evidence: Array<{ loanId: string; principalUsdc: number; decisionBlob: string; at: string }>;
}

/** Full-screen credit report viewer — the bureau's product, resolved from the
 *  on-chain ReportRegistry and fetched straight off Walrus. */
export function CreditReportModal({
  pointer,
  onClose,
}: {
  pointer: ReportPointer;
  onClose: () => void;
}) {
  const [report, setReport] = useState<ReportBlob | null>(null);
  const [sig, setSig] = useState<{ ok: boolean; reason: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${MFI.walrusAggregator}/v1/blobs/${pointer.blobId}`);
        if (!r.ok) throw new Error(String(r.status));
        const blob = (await r.json()) as Record<string, unknown>;
        if (!alive) return;
        setReport(blob as unknown as ReportBlob);
        setSig(await verifyAttestation(blob));
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pointer.blobId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] grid place-items-center bg-ink-950/85 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="bezel w-full max-w-2xl"
        >
        <div className="bezel-core max-h-[86dvh] overflow-y-auto">
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ink-950/95 px-6 py-4 backdrop-blur">
            <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-signal">
              <FileText size={15} />
              M-Fi credit report
              <span className="text-fg-faint">· #{pointer.sequence}</span>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-md border border-line text-fg-muted transition-colors hover:border-signal/50 hover:text-signal"
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>

          {!report && !failed && (
            <div className="grid place-items-center gap-3 px-6 py-20 font-mono text-xs text-fg-faint">
              <CircleNotch size={22} className="animate-spin text-signal" />
              fetching from Walrus…
            </div>
          )}
          {failed && (
            <div className="px-6 py-16 text-center font-mono text-xs text-denied">
              Could not fetch report blob from the aggregator.
            </div>
          )}

          {report && (
            <div className="px-6 pb-6">
              {/* attestation banner */}
              <div
                className={`mt-5 flex items-center gap-2.5 rounded-lg border px-4 py-3 font-mono text-xs ${
                  sig?.ok
                    ? 'border-repaid/30 bg-repaid/5 text-repaid'
                    : 'border-active/30 bg-active/5 text-active'
                }`}
              >
                {sig?.ok ? <SealCheck size={16} weight="fill" /> : <ShieldWarning size={16} weight="fill" />}
                <span>
                  {sig?.ok ? 'Verified in-browser — ' : 'Attestation: '}
                  {sig?.reason ?? 'checking…'}
                </span>
              </div>

              {/* subject */}
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-2xl text-fg">{report.agent.handle}</p>
                  <p className="mt-1 font-mono text-[11px] text-fg-faint">
                    {shortAddr(report.agent.address, 12, 6)} · {report.agent.job}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-5xl font-bold tracking-tight text-signal glow-text">
                    {report.standing.trustScore}
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-fg-faint">
                    trust / 1000
                  </p>
                </div>
              </div>

              {/* standing */}
              <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-line bg-line">
                <Cell k="loans repaid" v={`${report.standing.loansRepaid}/${report.standing.loansTaken}`} />
                <Cell k="repayment rate" v={`${report.standing.repaymentRatePct}%`} accent />
                <Cell k="lifetime borrowed" v={`$${report.standing.totalBorrowedUsdc.toLocaleString()}`} />
              </dl>

              {/* trust trajectory */}
              {report.history.length > 1 && (
                <div className="mt-6">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-fg-faint">
                    Trust trajectory · last {report.history.length} updates
                  </p>
                  <Sparkline points={report.history.map((h) => h.trustScore)} />
                </div>
              )}

              {/* evidence */}
              <div className="mt-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-fg-faint">
                  Evidence · {report.evidence.length} sealed decisions
                </p>
                <ul className="mt-3 divide-y divide-line overflow-hidden rounded-lg border border-line">
                  {report.evidence.slice(0, 6).map((ev) => (
                    <li key={ev.loanId} className="flex items-center justify-between gap-3 bg-ink-900/40 px-4 py-2.5">
                      <span className="truncate font-mono text-[11px] text-fg-muted">
                        ${ev.principalUsdc.toLocaleString()} · blob {ev.decisionBlob.slice(0, 14)}…
                      </span>
                      <a
                        href={`${MFI.walrusAggregator}/v1/blobs/${ev.decisionBlob}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-signal transition-colors hover:text-fg"
                      >
                        audit <ArrowUpRight size={11} weight="bold" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* footer */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 font-mono text-[11px] text-fg-faint">
                <span>
                  issued {new Date(report.generatedAt).toLocaleString()} · bureau {shortAddr(report.bureau)}
                </span>
                <a
                  href={`${MFI.walrusAggregator}/v1/blobs/${pointer.blobId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-signal transition-colors hover:text-fg"
                >
                  raw blob on Walrus <ArrowUpRight size={12} weight="bold" />
                </a>
              </div>
            </div>
          )}
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Cell({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="bg-ink-950 px-4 py-3.5">
      <dd className={`tnum text-lg ${accent ? 'text-repaid' : 'text-fg'}`}>{v}</dd>
      <dt className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-fg-faint">{k}</dt>
    </div>
  );
}

/** Minimal neon sparkline for the trust trajectory. */
function Sparkline({ points }: { points: number[] }) {
  const w = 560;
  const h = 56;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const step = w / Math.max(1, points.length - 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(h - 6 - ((p - min) / span) * (h - 12)).toFixed(1)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-14 w-full" preserveAspectRatio="none">
      <path d={d} fill="none" stroke="#00f5ff" strokeWidth="2" opacity="0.9" />
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sparkfill)" opacity="0.25" />
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00f5ff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00f5ff" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
