'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react';
import { SplineScene } from './ui/splite';

const SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

/** Interactive 3D showcase — a draggable agent rendered with Spline, reskinned
 *  to the M-Fi neon system. Fails gracefully to a neon placeholder if the
 *  Spline CDN is unreachable, so the section never breaks the page. */
export function Agent3D() {
  const [failed, setFailed] = useState(false);

  return (
    <section className="border-y border-line">
      <div className="mx-auto max-w-[1400px] px-5 py-20 lg:px-8 lg:py-24">
        <div className="relative h-[460px] overflow-hidden rounded-2xl border border-signal/20 bg-[radial-gradient(120%_120%_at_70%_30%,#0a0b12,#050508_60%)]">
          {/* cyan spotlight wash */}
          <div
            className="pointer-events-none absolute -left-20 -top-32 h-[480px] w-[560px]"
            style={{ background: 'radial-gradient(50% 50% at 42% 36%, rgba(0,245,255,0.20), transparent 70%)' }}
          />
          {/* faint grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,245,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.05) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(100% 80% at 60% 40%, #000, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(100% 80% at 60% 40%, #000, transparent 75%)',
            }}
          />

          {/* status chip */}
          <div className="absolute left-5 top-4 z-20 flex items-center gap-2">
            <span className="flicker h-1.5 w-1.5 rounded-full bg-repaid shadow-[0_0_8px_#a8ff00]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">// interactive · live agent</span>
          </div>

          <div className="relative z-10 flex h-full flex-col md:flex-row">
            {/* left copy */}
            <div className="flex flex-1 flex-col justify-center px-7 pb-6 pt-16 md:px-12 md:py-0">
              <h2 className="font-display text-4xl font-black leading-[0.94] tracking-tight text-[#eaf6ff] md:text-5xl">
                Meet the agents
                <br />
                <span className="glow-text">you bank</span>.
              </h2>
              <p className="mt-4 max-w-[34ch] text-base leading-snug text-fg-muted md:text-lg">
                Autonomous borrowers, underwritten in real time and rendered in 3D. Drag to
                explore the machine economy M-Fi serves.
              </p>
              <Link
                href="/app"
                className="btn-cyan group mt-7 inline-flex w-fit items-center gap-3 py-3 pl-7 pr-3 font-display text-xs font-bold uppercase tracking-[0.18em]"
              >
                Enter the protocol
                <span className="grid h-8 w-8 place-items-center bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                  <ArrowRight size={15} weight="bold" />
                </span>
              </Link>
            </div>

            {/* right — the 3D scene */}
            <div className="relative min-h-[220px] flex-1">
              {/* cyan rim glow so the dark agent separates from the black */}
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{ background: 'radial-gradient(45% 55% at 58% 52%, rgba(0,245,255,0.16), transparent 70%)' }}
              />
              {failed ? (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-signal/30 text-signal">
                      <span className="font-display text-3xl font-black">·M</span>
                    </div>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-fg-faint">3D scene offline</p>
                  </div>
                </div>
              ) : (
                <SplineScene scene={SCENE} className="h-full w-full" onError={() => setFailed(true)} />
              )}
              <span className="pointer-events-none absolute bottom-3 right-4 font-mono text-[11px] uppercase tracking-[0.28em] text-signal/55">
                drag to rotate · 3D
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
