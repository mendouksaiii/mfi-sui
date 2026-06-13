import { Nav } from '@/components/Nav';
import { AppTabs } from '@/components/AppTabs';
import { Footer } from '@/components/Footer';

/** Dashboard shell — the top nav, a sticky tab bar, then the active section's
 *  standalone page. Each section lives at its own route under /app. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="w-full max-w-full overflow-x-hidden text-fg">
      <Nav />
      {/* pt-16 clears the fixed nav so the sticky tab bar sits flush beneath it */}
      <div className="pt-16">
        <AppTabs />
        <div className="relative min-h-[72vh] bg-ink-950/92 backdrop-blur-md">
          {children}
          <Footer />
        </div>
      </div>
    </main>
  );
}
