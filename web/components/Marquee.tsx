const ITEMS = [
  'Autonomous underwriting',
  'Walrus-audited decisions',
  'Soulbound credit',
  'Single-PTB disbursement',
  'Scallop yield treasury',
  'On-chain reputation',
  'No KYC',
  'Agent-native',
];

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-line bg-signal/[0.03] py-5">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="flex w-max animate-marquee gap-10 font-display text-2xl tracking-tight text-fg-muted md:text-3xl">
        {[...ITEMS, ...ITEMS].map((t, i) => (
          <span key={i} className="flex items-center gap-10">
            {t}
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
        ))}
      </div>
    </div>
  );
}
