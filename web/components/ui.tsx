'use client';

import { animate, useMotionValue, useTransform, motion } from 'framer-motion';
import { useEffect, memo } from 'react';
import { ScrambleText } from './fx/ScrambleText';

/** Spring-counted number. Isolated client leaf — never re-renders parents. */
export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    prefix +
    v.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix,
  );

  useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [mv, value]);

  return <motion.span className="tnum">{rounded}</motion.span>;
});

/** Breathing status dot with a pulse ring. */
export function StatusDot({ tone = 'signal' }: { tone?: 'signal' | 'repaid' | 'active' | 'denied' }) {
  const color = {
    signal: 'bg-signal',
    repaid: 'bg-repaid',
    active: 'bg-active',
    denied: 'bg-denied',
  }[tone];
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      <span className={`absolute inline-flex h-full w-full rounded-full ${color} animate-pulse-ring`} />
      <span className={`relative inline-flex h-2 w-2 rounded-full ${color}`} />
    </span>
  );
}

export function SectionLabel({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.2em] text-fg-faint">
      <span className="text-signal">{index}</span>
      <span className="h-px w-8 bg-line-strong" />
      <span>{typeof children === 'string' ? <ScrambleText text={children} trigger="view" /> : children}</span>
    </div>
  );
}

/** Thin trust-score meter, 0-1000. */
export function TrustMeter({ score }: { score: number }) {
  const pct = Math.min(100, (score / 1000) * 100);
  const tone = score >= 900 ? 'bg-repaid' : score >= 500 ? 'bg-signal' : 'bg-active';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 overflow-hidden rounded-full bg-ink-700">
        <motion.div
          className={`h-full ${tone}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="tnum text-xs text-fg-muted">{score}</span>
    </div>
  );
}

export function StatusTag({ status }: { status: 'ACTIVE' | 'REPAID' | 'DEFAULTED' }) {
  const map = {
    ACTIVE: { tone: 'active' as const, label: 'ACTIVE', text: 'text-active' },
    REPAID: { tone: 'repaid' as const, label: 'REPAID', text: 'text-repaid' },
    DEFAULTED: { tone: 'denied' as const, label: 'DEFAULT', text: 'text-denied' },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider ${map.text}`}>
      <StatusDot tone={map.tone} />
      {map.label}
    </span>
  );
}
