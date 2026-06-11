'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from '@phosphor-icons/react';
import { AGENTS } from '@/lib/mock';
import { shortAddr } from '@/lib/config';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const BLURB: Record<string, string> = {
  'agent-77-scraping': 'Borrows gas to run revenue-positive scraping jobs, repays the moment data sells.',
  'agent-42-arbitrage': 'Draws short-term capital to capture cross-DEX spreads, settles within the hour.',
  'agent-91-oracle': 'Funds 24-hour price-feed gas as critical infrastructure for downstream protocols.',
  'agent-15-yield': 'Rebalances Scallop positions into higher-APY pools, compounding the treasury.',
  'agent-63-nft': 'Mints and lists time-boxed collections, returning principal within the drop window.',
  'agent-08-relayer': 'Tops up relayer gas across chains — held to a higher trust bar before approval.',
};

export function HorizontalAgents() {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const getAmount = () => track.current!.scrollWidth - window.innerWidth + 80;
      gsap.to(track.current, {
        x: () => -getAmount(),
        ease: 'none',
        scrollTrigger: {
          trigger: section.current,
          start: 'top top',
          end: () => '+=' + getAmount(),
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: section },
  );

  return (
    <section ref={section} className="relative overflow-hidden border-y border-line text-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 bottom-0 select-none font-display text-[18rem] font-black leading-none text-signal/[0.04] lg:text-[24rem]"
      >
        03
      </div>
      <div className="flex h-[100dvh] flex-col justify-center">
        <div className="mx-auto mb-10 w-full max-w-[1400px] px-5 lg:px-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00f5ff]">Who borrows</p>
          <h2 className="text-section mt-4 max-w-[16ch]">
            A new class of <span className="text-[#00f5ff] glow-text">economic actor</span>.
          </h2>
        </div>

        <div ref={track} className="flex gap-6 px-5 will-change-transform lg:px-8">
          {AGENTS.map((a, i) => (
            <article
              key={a.address}
              className="spotlight group relative flex h-[58vh] w-[78vw] shrink-0 flex-col justify-between rounded-2xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-md sm:w-[60vw] lg:w-[34vw]"
            >
              <div className="flex items-start justify-between">
                <span className="font-display text-7xl tracking-tightest text-white/15">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="rounded-full border border-white/20 px-3 py-1 font-mono text-[11px] text-white/75">
                  {a.job}
                </span>
              </div>
              <div>
                <h3 className="font-display text-3xl tracking-tight">{a.id}</h3>
                <p className="mt-1 font-mono text-xs text-white/45">{shortAddr(a.address)}</p>
                <p className="mt-5 max-w-[40ch] text-sm leading-relaxed text-white/70">
                  {BLURB[a.id] ?? 'Autonomous agent borrowing against on-chain reputation.'}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 font-mono text-xs text-signal opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  view on-chain history <ArrowRight size={13} weight="bold" />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
