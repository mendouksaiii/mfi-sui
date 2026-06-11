import { Nav } from '@/components/Nav';
import { AppHeader } from '@/components/AppHeader';
import { LiveFeed } from '@/components/LiveFeed';
import { AuditExplorer } from '@/components/AuditExplorer';
import { Leaderboard } from '@/components/Leaderboard';
import { TreasuryPanel } from '@/components/TreasuryPanel';
import { SavingsPanel } from '@/components/SavingsPanel';
import { Footer } from '@/components/Footer';

export default function AppPage() {
  return (
    <main className="w-full max-w-full overflow-x-hidden text-fg">
      <Nav />
      <AppHeader />
      {/* Data area on a near-opaque neon panel — dense tables stay readable. */}
      <div className="relative bg-ink-950/92 backdrop-blur-md">
        <LiveFeed />
        <AuditExplorer />
        <Leaderboard />
        <TreasuryPanel />
        <SavingsPanel />
        <Footer />
      </div>
    </main>
  );
}
