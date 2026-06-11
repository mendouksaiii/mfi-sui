'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { ArrowRight, Pulse, CaretDown } from '@phosphor-icons/react';
import { Magnetic } from './fx/Magnetic';
import { ScrambleText } from './fx/ScrambleText';
import { AnimatedNumber } from './ui';
import { useLiveFeed, useTreasuryStats } from '@/lib/hooks';
import { fmtUsdc, shortAddr } from '@/lib/config';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const HEAD_1 = 'The bank for';
const HEAD_2 = 'autonomous agents';

export function HeroX() {
  const root = useRef<HTMLElement>(null);
  const { data: feed } = useLiveFeed();
  const { stats } = useTreasuryStats();

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('.hero-line .word', { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.06 })
        .from('.hero-rail', { x: -24, opacity: 0, duration: 0.8 }, '-=0.7')
        .from('.hero-sub', { y: 20, opacity: 0, duration: 0.9 }, '-=0.6')
        .from('.hero-cta', { y: 16, opacity: 0, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .from('.hero-panel', { y: 48, opacity: 0, duration: 1, scale: 0.97 }, '-=0.8')
        .from('.hero-strip > *', { y: 24, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=0.5')
        .from('.hero-scroll', { opacity: 0, duration: 0.6 }, '-=0.2');

      gsap.to('.hero-panel', {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-copy', {
        yPercent: 12,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-ghost', {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative min-h-[100dvh] overflow-hidden">
      {/* Ghost index numeral — editorial scale anchor */}
      <div
        aria-hidden
        className="hero-ghost pointer-events-none absolute -right-10 top-16 select-none font-display text-[26rem] font-black leading-none text-signal/[0.045] lg:text-[34rem]"
      >
        01
      </div>

      {/* Vertical editorial side-rail */}
      <div className="hero-rail pointer-events-none absolute left-5 top-0 hidden h-full flex-col items-center lg:flex">
        <div className="h-28 w-px bg-gradient-to-b from-transparent to-signal/50" />
        <span
          className="my-6 font-mono text-[10px] uppercase tracking-[0.5em] text-signal/70"
          style={{ writingMode: 'vertical-rl' }}
        >
          MACHINE FINANCE PROTOCOL — SUI TESTNET
        </span>
        <div className="w-px flex-1 bg-gradient-to-b from-signal/50 via-line to-transparent" />
        <span className="mb-28 mt-6 font-mono text-[10px] text-fg-faint" style={{ writingMode: 'vertical-rl' }}>
          36.61°N&nbsp;&nbsp;121.90°W
        </span>
      </div>

      <div className="relative z-10 mx-auto grid min-h-[88dvh] max-w-[1400px] grid-cols-1 items-center gap-12 px-5 pt-24 lg:grid-cols-[1.25fr_0.95fr] lg:gap-6 lg:px-20">
        {/* Copy — editorial left block */}
        <div className="hero-copy flex flex-col justify-center pb-8 lg:pb-0">
          <div className="hero-sub neon-tag mb-8 inline-flex w-fit items-center gap-2 rounded-sm px-3.5 py-1.5 text-[11px]">
            <span className="flicker h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_10px_#00f5ff]" />
            <ScrambleText text="The on-chain credit bureau for AI agents" />
          </div>

          <h1 className="text-hero max-w-6xl tracking-tightest text-fg">
            <span className="hero-line block overflow-hidden">
              {HEAD_1.split(' ').map((w) => (
                <span key={w} className="word mr-[0.22em] inline-block">
                  {w}
                </span>
              ))}
            </span>
            <span className="hero-line block overflow-hidden text-fg-muted">
              {HEAD_2.split(' ').map((w, i) => (
                <span
                  key={w + i}
                  className={`word mr-[0.22em] inline-block ${w === 'autonomous' || w === 'agents' ? 'glow-text' : ''}`}
                >
                  {w}
                </span>
              ))}
            </span>
          </h1>

          {/* Asymmetric sub-row: indented copy + hairline */}
          <div className="hero-sub mt-9 flex max-w-[58ch] items-start gap-5 lg:ml-[8%]">
            <div className="mt-2 hidden h-px w-14 shrink-0 bg-signal/60 sm:block" />
            <p className="text-base leading-relaxed text-fg-muted md:text-lg">
              AI agents borrow the moment they need capital. M-Fi underwrites every
              request in real time and proves the decision on Walrus — no humans, no
              forms, no identity.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 lg:ml-[8%]">
            <Magnetic className="hero-cta">
              <Link
                href="#feed"
                className="btn-cyan group inline-flex items-center gap-2 px-7 py-3.5 font-display text-xs font-bold uppercase tracking-[0.15em] active:scale-[0.97]"
              >
                Enter the underwriter
                <ArrowRight size={15} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Magnetic>
            <Magnetic className="hero-cta" strength={0.25}>
              <Link
                href="#audit"
                className="btn-ghost inline-flex items-center gap-2 px-7 py-3.5 font-display text-xs font-bold uppercase tracking-[0.15em]"
              >
                Inspect a decision
              </Link>
            </Magnetic>
          </div>
        </div>

        {/* Live underwriter panel — offset downward for editorial tension */}
        <div className="flex items-center lg:mt-24">
          <div className="hero-panel neon-card w-full overflow-hidden" style={{ borderTop: '2px solid #00f5ff' }}>
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="flex items-center gap-2 font-mono text-xs text-signal">
                <Pulse size={14} weight="bold" className="text-signal" />
                underwriter.live
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg-faint">
                <span className="flicker h-1.5 w-1.5 rounded-full bg-repaid shadow-[0_0_10px_#a8ff00]" /> streaming
              </span>
            </div>
            <div className="divide-y divide-line">
              {feed.slice(0, 4).map((l) => (
                <div key={l.loanId} className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-signal/5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm border border-line bg-ink-800 font-mono text-[10px] text-signal">
                    {l.agent.id.split('-')[1]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] text-fg">{l.agent.id}</p>
                    <p className="font-mono text-[10px] text-fg-faint">{shortAddr(l.agent.address)}</p>
                  </div>
                  <span className="tnum text-sm text-fg">${fmtUsdc(l.principal)}</span>
                  <span className={`font-mono text-[10px] tracking-wider ${l.status === 'REPAID' ? 'text-repaid' : l.status === 'ACTIVE' ? 'text-active' : 'text-denied'}`}>
                    {l.status === 'DEFAULTED' ? 'DENIED' : l.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gapless live-stats strip — full-bleed hairline grid */}
      <div className="hero-strip relative z-10 mx-auto grid max-w-[1400px] grid-cols-2 border-y border-line lg:mx-20 lg:grid-cols-4">
        <Stat label="Liquid treasury" value={Number(fmtUsdc(stats.liquid).replace(/,/g, ''))} prefix="$" />
        <Stat label="Total disbursed" value={Number(fmtUsdc(stats.totalDisbursed).replace(/,/g, ''))} prefix="$" divide />
        <Stat label="Active loans" value={stats.activeLoans} divide />
        <Stat
          label="Depositor yield"
          value={stats.depositorYieldPct}
          suffix="%"
          decimals={2}
          accent
          divide
        />
      </div>

      <div className="hero-scroll relative z-10 flex flex-col items-center gap-1.5 pb-6 pt-8 text-fg-faint">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Scroll to explore</span>
        <CaretDown size={16} className="animate-bounce text-signal" />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  accent,
  divide,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent?: boolean;
  divide?: boolean;
}) {
  return (
    <div className={`px-6 py-6 ${divide ? 'border-l border-line' : ''}`}>
      <div className={`font-display text-2xl font-bold tracking-tight md:text-3xl ${accent ? 'text-repaid' : 'text-fg'}`}>
        <span className="text-fg-faint">{prefix}</span>
        <AnimatedNumber value={value} decimals={decimals} suffix={suffix} />
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-fg-faint">{label}</div>
    </div>
  );
}
