'use client';

import { useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STEPS = [
  { n: '01', title: 'Underwrite', body: 'An LLM scores the requesting agent against a live snapshot of its on-chain behavior — balances, age, transaction count.' },
  { n: '02', title: 'Seal to Walrus', body: 'The full decision — reasoning, confidence, and the exact telemetry seen — is written to a Walrus blob. Permanently auditable.' },
  { n: '03', title: 'Mint soulbound loan', body: 'A non-transferable Loan object is bound to the borrower, carrying the Walrus blob ID as on-chain proof of how it was approved.' },
  { n: '04', title: 'Disburse USDC', body: 'Capital leaves the shared treasury and lands in the agent wallet. Underwrite, record, and pay — one atomic programmable transaction.' },
];

export function Pipeline() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: '+=300%',
        pin: '.pipe-stage',
        scrub: true,
        onUpdate: (self) => {
          const i = Math.min(STEPS.length - 1, Math.floor(self.progress * STEPS.length));
          setActive((prev) => (prev === i ? prev : i));
        },
      });
      gsap.to('.pipe-progress', {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: '+=300%', scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-8 top-10 select-none font-display text-[16rem] font-black leading-none text-signal/[0.04] lg:text-[22rem]"
      >
        04
      </div>
      <div className="pipe-stage flex min-h-[100dvh] items-center">
        <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          {/* Left — pinned heading */}
          <div className="flex flex-col justify-center text-white">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#00f5ff]">The loop</p>
            <h2 className="text-section mt-4 max-w-[14ch]">
              One request. One <span className="text-[#00f5ff] glow-text">atomic</span> transaction.
            </h2>
            <p className="mt-6 max-w-[44ch] text-sm leading-relaxed text-white/70">
              Every loan composes withdrawal, underwriting, proof, and payment into
              a single Sui programmable transaction block — no partial states, no
              trust gaps.
            </p>
            <div className="mt-8 font-mono text-sm text-white/50">
              step <span className="tnum text-[#00f5ff]">{STEPS[active].n}</span> / 04
            </div>
          </div>

          {/* Right — stepping list with progress rail */}
          <div className="relative flex flex-col justify-center gap-3 pl-8 text-white">
            <div className="absolute left-0 top-0 h-full w-px bg-white/15">
              <div className="pipe-progress absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-signal" />
            </div>
            {STEPS.map((s, i) => {
              const on = i === active;
              return (
                <div
                  key={s.n}
                  className={`rounded-xl border p-6 backdrop-blur-md transition-all duration-500 ${
                    on
                      ? 'border-[#00f5ff]/50 bg-white/[0.08] glow-ring'
                      : 'border-white/10 bg-white/[0.02] opacity-50'
                  }`}
                >
                  <div className="flex items-baseline gap-3">
                    <span className={`tnum font-mono text-sm ${on ? 'text-[#00f5ff]' : 'text-white/40'}`}>{s.n}</span>
                    <h3 className="font-display text-xl tracking-tight">{s.title}</h3>
                  </div>
                  <p
                    className="grid overflow-hidden text-sm leading-relaxed text-white/70 transition-all duration-500"
                    style={{ gridTemplateRows: on ? '1fr' : '0fr', marginTop: on ? '0.75rem' : 0 }}
                  >
                    <span className="min-h-0">{s.body}</span>
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
