import { LogoMark } from './Logo';
import { MFI, shortAddr } from '@/lib/config';

const STACK = ['Sui Move', 'Walrus', 'Scallop', 'Groq LLaMA 3.1', 'dapp-kit', 'OpenClaw ACP'];

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink-900/70 text-fg backdrop-blur-xl">
      {/* Tech marquee */}
      <div className="overflow-hidden border-b border-line py-4">
        <div className="flex w-max animate-marquee gap-12 font-mono text-xs uppercase tracking-[0.2em] text-fg-faint">
          {[...STACK, ...STACK, ...STACK, ...STACK].map((s, i) => (
            <span key={i} className="flex items-center gap-12">
              {s}
              <span className="h-1 w-1 rounded-full bg-signal" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-12 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <LogoMark />

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-fg-muted">
          <a href={`${MFI.explorer}/package/${MFI.packageId}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-signal">
            package {shortAddr(MFI.packageId)}
          </a>
          <a href={`${MFI.explorer}/object/${MFI.treasuryId}`} target="_blank" rel="noreferrer" className="transition-colors hover:text-signal">
            treasury {shortAddr(MFI.treasuryId)}
          </a>
          <span className="text-fg-faint">Sui Overflow 2026</span>
        </div>
      </div>
    </footer>
  );
}
