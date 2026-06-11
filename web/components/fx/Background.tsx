'use client';

import { NeonNetwork } from './NeonNetwork';

/** Neon backdrop: an animated node-network over a faint grid, with drifting
 *  glow orbs and a vignette. Fixed, pointer-events-none, behind all content. */
export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      {/* faint static grid for depth */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,245,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.03) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      {/* animated agent network */}
      <div className="absolute inset-0">
        <NeonNetwork />
      </div>
      {/* ambient glow orbs */}
      <div
        className="absolute h-[620px] w-[620px] animate-pulse-glow-1"
        style={{ top: -140, left: -140, background: 'radial-gradient(circle, rgba(0,245,255,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute h-[520px] w-[520px] animate-pulse-glow-2"
        style={{ bottom: -140, right: -100, background: 'radial-gradient(circle, rgba(255,0,110,0.09) 0%, transparent 70%)' }}
      />
      <div
        className="absolute h-[440px] w-[440px] animate-float"
        style={{ top: '42%', right: '8%', background: 'radial-gradient(circle, rgba(191,0,255,0.06) 0%, transparent 70%)' }}
      />
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(130% 130% at 50% 30%, transparent 62%, rgba(5,5,8,0.5) 100%)' }} />
    </div>
  );
}
