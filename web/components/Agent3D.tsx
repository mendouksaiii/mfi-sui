'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from '@phosphor-icons/react';
import { SplineScene } from './ui/splite';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

/** Interactive 3D showcase — a full-bleed immersive band with a draggable
 *  agent rendered by Spline, reskinned to the M-Fi neon system. Entrance is
 *  GSAP/ScrollTrigger-driven (staggered text, parallax robot, drifting grid);
 *  fails gracefully to a neon placeholder if the Spline CDN is unreachable. */
export function Agent3D() {
  const root = useRef<HTMLElement>(null);
  const [failed, setFailed] = useState(false);

  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // staggered entrance for the left copy
      gsap.from('.a3d-rev', {
        y: 44,
        opacity: 0,
        filter: 'blur(6px)',
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: { trigger: root.current, start: 'top 74%' },
      });

      // the stage fades + scales up as it enters
      gsap.from('.a3d-stage', {
        opacity: 0,
        scale: 0.9,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.current, start: 'top 74%' },
      });

      // parallax: the robot drifts up as the band scrolls through the viewport
      gsap.to('.a3d-parallax', {
        yPercent: -14,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });

      // the grid drifts the opposite way for depth
      gsap.to('.a3d-grid', {
        backgroundPositionY: '120px',
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1.4 },
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      className="relative h-[600px] overflow-hidden border-y border-signal/20 bg-[radial-gradient(120%_120%_at_70%_30%,#0a0b12,#050508_60%)] lg:h-[680px]"
    >
      {/* cyan spotlight wash */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[700px] w-[800px]"
        style={{ background: 'radial-gradient(50% 50% at 42% 36%, rgba(0,245,255,0.18), transparent 70%)' }}
      />
      {/* drifting grid */}
      <div
        className="a3d-grid pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.05) 1px,transparent 1px)',
          backgroundSize: '46px 46px',
          maskImage: 'radial-gradient(100% 80% at 60% 40%, #000, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(100% 80% at 60% 40%, #000, transparent 78%)',
        }}
      />

      {/* status chip */}
      <div className="a3d-rev absolute left-6 top-6 z-20 flex items-center gap-2 lg:left-10">
        <span className="flicker h-1.5 w-1.5 rounded-full bg-repaid shadow-[0_0_8px_#a8ff00]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-signal">// interactive · live agent</span>
      </div>

      <div className="relative z-10 mx-auto flex h-full max-w-[1700px] flex-col md:flex-row">
        {/* left copy */}
        <div className="flex flex-1 flex-col justify-center px-7 pb-6 pt-20 md:px-12 md:py-0 lg:px-20">
          <h2 className="a3d-rev font-display text-5xl font-black leading-[0.92] tracking-tight text-[#eaf6ff] md:text-6xl lg:text-7xl">
            Meet the agents
            <br />
            <span className="glow-text">you bank</span>.
          </h2>
          <p className="a3d-rev mt-6 max-w-[40ch] text-base leading-snug text-fg-muted md:text-lg lg:text-xl">
            Autonomous borrowers, underwritten in real time and rendered in 3D. Drag to explore the
            machine economy M-Fi serves.
          </p>
          <Link
            href="/app"
            className="a3d-rev btn-cyan group mt-9 inline-flex w-fit items-center gap-3 py-3.5 pl-8 pr-3 font-display text-xs font-bold uppercase tracking-[0.18em]"
          >
            Enter the protocol
            <span className="grid h-9 w-9 place-items-center bg-black/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
              <ArrowRight size={16} weight="bold" />
            </span>
          </Link>
        </div>

        {/* right — the 3D scene */}
        <div className="a3d-stage relative min-h-[260px] flex-1 md:min-h-0 lg:flex-[1.2]">
          {/* cyan rim glow so the dark agent separates from the black */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            style={{ background: 'radial-gradient(45% 55% at 58% 52%, rgba(0,245,255,0.18), transparent 70%)' }}
          />
          <div className="a3d-parallax absolute inset-0">
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
          </div>
          <span className="pointer-events-none absolute bottom-4 right-6 z-10 font-mono text-[11px] uppercase tracking-[0.28em] text-signal/55">
            drag to rotate · 3D
          </span>
        </div>
      </div>
    </section>
  );
}
