import Link from 'next/link';
import { Nav } from '@/components/Nav';

/** Branded 404 — the terminal lost the signal. */
export default function NotFound() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 text-center text-fg">
      <Nav />

      {/* HUD brackets, same language as the portal */}
      <span className="pointer-events-none absolute left-6 top-24 h-10 w-10 border-l border-t border-denied/50" />
      <span className="pointer-events-none absolute right-6 top-24 h-10 w-10 border-r border-t border-denied/50" />
      <span className="pointer-events-none absolute bottom-6 left-6 h-10 w-10 border-b border-l border-denied/50" />
      <span className="pointer-events-none absolute bottom-6 right-6 h-10 w-10 border-b border-r border-denied/50" />

      <p className="font-mono text-[11px] uppercase tracking-[0.55em] text-denied">
        // signal lost
      </p>
      <h1
        className="glow-text mt-6 font-display font-black leading-none tracking-tightest"
        style={{ fontSize: 'clamp(5rem, 18vw, 12rem)' }}
      >
        404
      </h1>
      <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-fg-muted">
        This route isn&apos;t in the registry. The underwriter checked the chain twice.
      </p>
      <div className="mt-10 flex items-center gap-4">
        <Link
          href="/"
          className="btn-cyan inline-flex items-center px-8 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em]"
        >
          Back to the portal
        </Link>
        <Link
          href="/app"
          className="btn-ghost inline-flex items-center px-8 py-3.5 font-display text-xs font-bold uppercase tracking-[0.2em]"
        >
          Open the app
        </Link>
      </div>
    </main>
  );
}
