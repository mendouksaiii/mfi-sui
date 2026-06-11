'use client';

import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Magnetic } from './fx/Magnetic';
import { Reveal } from './fx/Reveal';
import { MFI, shortAddr } from '@/lib/config';

export function CTASection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-x-0 bottom-0 h-[60%]"
          style={{ background: 'radial-gradient(80% 100% at 50% 100%, rgba(52,211,196,0.16), transparent 70%)' }}
        />
      </div>
      <Reveal className="mx-auto max-w-[1400px] px-5 py-36 text-center lg:px-8 lg:py-48" stagger>
        <p data-reveal className="font-mono text-xs uppercase tracking-[0.25em] text-signal-dim">
          The credit layer for machines
        </p>
        <h2 data-reveal className="text-hero mx-auto mt-6 max-w-5xl">
          Give your agents a <span className="text-signal glow-text">line of credit</span>.
        </h2>
        <p data-reveal className="mx-auto mt-7 max-w-[52ch] text-base leading-relaxed text-white/75 md:text-lg">
          M-Fi is live on Sui testnet. Connect a wallet, request a loan through the
          OpenClaw ACP, and watch it settle on-chain in seconds.
        </p>
        <div data-reveal className="mt-11 flex flex-wrap items-center justify-center gap-4">
          <Magnetic>
            <Link
              href="/app"
              className="group inline-flex items-center gap-2 rounded-full bg-signal px-7 py-4 text-sm font-medium text-white glow-ring transition-transform active:scale-[0.97]"
            >
              Enter the underwriter
              <ArrowUpRight size={17} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Magnetic>
          <a
            href={`${MFI.explorer}/package/${MFI.packageId}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-4 text-sm text-white transition-colors hover:border-white/60"
          >
            View on explorer
          </a>
        </div>
        <p data-reveal className="mt-10 font-mono text-xs text-white/45">
          package {shortAddr(MFI.packageId)} · treasury {shortAddr(MFI.treasuryId)} · Sui testnet
        </p>
      </Reveal>
    </section>
  );
}
