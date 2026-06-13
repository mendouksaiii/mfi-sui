import Link from 'next/link';
import { Pulse, Medal, ShieldCheck, Vault, PiggyBank, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { AppHeader } from '@/components/AppHeader';

const SECTIONS = [
  { href: '/app/feed', label: 'Live Feed', icon: Pulse, blurb: 'Every LoanDisbursed / LoanRepaid event, streamed from the Sui fullnode.' },
  { href: '/app/reputation', label: 'Reputation', icon: Medal, blurb: 'On-chain trust scores — earned by behavior, with portable credit reports.' },
  { href: '/app/audit', label: 'Audit', icon: ShieldCheck, blurb: 'Inspect any decision: verify it’s sealed on Walrus, signed, chain-pinned.' },
  { href: '/app/treasury', label: 'Treasury', icon: Vault, blurb: 'The yield-bearing vault — liquid funds, exposure, and repayment health.' },
  { href: '/app/savings', label: 'Savings', icon: PiggyBank, blurb: 'Deposit test USDC, mint LP shares, withdraw with accrued yield — live.' },
];

export default function AppOverview() {
  return (
    <>
      <AppHeader />
      <section className="mx-auto max-w-[1400px] px-5 pb-24 lg:px-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg-faint">Explore the protocol</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map(({ href, label, icon: Icon, blurb }) => (
            <Link
              key={href}
              href={href}
              className="group relative flex flex-col rounded-xl border border-line-strong bg-ink-950 p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-signal/40 hover:shadow-[0_0_30px_rgba(0,245,255,0.12)]"
            >
              <Icon size={22} className="text-signal" weight="light" />
              <h3 className="mt-5 font-display text-lg font-medium tracking-tight text-fg">{label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{blurb}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-signal">
                Open
                <ArrowRight size={13} weight="bold" className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
