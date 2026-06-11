'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import Link from 'next/link';
import { ArrowRight, CaretDown } from '@phosphor-icons/react';
import { Magnetic } from './fx/Magnetic';
import { ScrambleText } from './fx/ScrambleText';

gsap.registerPlugin(useGSAP);

/** The portal: a logo-led splash. The glowing ·M-Fi wordmark is the centerpiece,
 *  framed by a HUD, over the live node-network. This is the brand entrance — no
 *  data, just identity and motion. Scroll reveals the breakdown below. */
export function PortalHero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.from('.hud-corner', { scale: 0.4, opacity: 0, duration: 0.6, stagger: 0.06 })
        .from('.hud-line', { opacity: 0, duration: 0.5 }, '-=0.3')
        .from('.portal-logo', { scale: 1.18, opacity: 0, filter: 'blur(14px)', duration: 1.1 }, '-=0.2')
        .from('.portal-sub', { y: 18, opacity: 0, duration: 0.7 }, '-=0.5')
        .from('.portal-cta', { y: 16, opacity: 0, duration: 0.7 }, '-=0.4')
        .from('.portal-scroll', { opacity: 0, duration: 0.6 }, '-=0.2');
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5">
      {/* HUD corner brackets */}
      <span className="hud-corner pointer-events-none absolute left-6 top-24 h-10 w-10 border-l border-t border-signal/60" />
      <span className="hud-corner pointer-events-none absolute right-6 top-24 h-10 w-10 border-r border-t border-signal/60" />
      <span className="hud-corner pointer-events-none absolute bottom-6 left-6 h-10 w-10 border-b border-l border-signal/60" />
      <span className="hud-corner pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b border-r border-signal/60" />

      {/* top status readout */}
      <div className="hud-line pointer-events-none absolute left-1/2 top-24 flex -translate-x-1/2 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-signal/70">
        <span className="flicker h-1.5 w-1.5 rounded-full bg-repaid shadow-[0_0_8px_#a8ff00]" />
        <ScrambleText text="System Online" />
        <span className="text-fg-faint">·</span>
        <span className="text-fg-faint">Sui Testnet</span>
        <span className="text-fg-faint">·</span>
        <span className="text-fg-faint">v1.0</span>
      </div>

      {/* side vertical readouts */}
      <span
        className="hud-line pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.5em] text-fg-faint lg:block"
        style={{ writingMode: 'vertical-rl' }}
      >
        Machine Finance Protocol
      </span>
      <span
        className="hud-line pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.5em] text-fg-faint lg:block"
        style={{ writingMode: 'vertical-rl' }}
      >
        Underwritten by AI · Proven on Walrus
      </span>

      {/* CENTERPIECE */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="portal-sub mb-7 font-mono text-[11px] uppercase tracking-[0.55em] text-signal">
          <ScrambleText text="The on-chain credit bureau" />
        </p>

        {/* the logo */}
        <h1
          className="portal-logo glow-text breathe font-display font-black leading-[0.85] tracking-tightest"
          style={{ fontSize: 'clamp(4rem, 15vw, 13rem)' }}
        >
          <span className="mr-[0.06em] align-middle text-[0.5em]">&#9679;</span>M&#8211;Fi
        </h1>
        <p className="portal-sub mt-3 font-mono text-sm uppercase tracking-[0.8em] text-fg-muted sm:text-base">
          Protocol
        </p>

        {/* tagline */}
        <p className="portal-sub mt-10 max-w-[42ch] font-sans text-lg leading-snug text-fg-muted md:text-xl">
          Autonomous credit for the agent economy. AI agents borrow at machine
          speed — judged on behavior, never identity.
        </p>

        {/* single enter CTA */}
        <div className="portal-cta mt-12 flex flex-col items-center gap-4">
          <Magnetic>
            <Link
              href="/app"
              className="btn-cyan group inline-flex items-center gap-3 py-3 pl-10 pr-3 font-display text-sm font-bold uppercase tracking-[0.2em]"
            >
              Enter the protocol
              {/* button-in-button: the arrow rides its own machined chip */}
              <span className="grid h-9 w-9 place-items-center bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105">
                <ArrowRight size={16} weight="bold" />
              </span>
            </Link>
          </Magnetic>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-fg-faint">
            Live underwriter · agents · audit · yield
          </span>
        </div>
      </div>

      {/* scroll cue */}
      <Link
        href="#how"
        className="portal-scroll absolute inset-x-0 bottom-9 z-10 mx-auto flex w-fit flex-col items-center gap-1.5 text-fg-faint transition-colors hover:text-signal"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">How it works</span>
        <CaretDown size={16} className="animate-bounce text-signal" />
      </Link>
    </section>
  );
}
