import { Nav } from '@/components/Nav';
import { PortalHero } from '@/components/PortalHero';
import { Marquee } from '@/components/Marquee';
import { ProofSection } from '@/components/ProofSection';
import { HorizontalAgents } from '@/components/HorizontalAgents';
import { Pipeline } from '@/components/Pipeline';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';

/**
 * Landing — a portal. It leads with the logo + motion and breaks down what
 * M-Fi is. No live tables here: every activity (feed, audit, reputation,
 * treasury, savings) lives in the dashboard at /app.
 */
export default function Home() {
  return (
    <main className="w-full max-w-full overflow-x-hidden text-fg">
      <Nav />
      <PortalHero />
      <Marquee />
      <div id="how" className="scroll-mt-16">
        <ProofSection />
        <HorizontalAgents />
        <Pipeline />
      </div>
      <CTASection />
      <Footer />
    </main>
  );
}
