import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Providers } from './providers';
import { Background } from '@/components/fx/Background';
import { ScrollProgress } from '@/components/fx/ScrollProgress';
import './globals.css';

export const metadata: Metadata = {
  title: 'M-Fi — Autonomous Credit for the Agent Economy',
  description:
    'M-Fi (Machine Finance) is an autonomous AI credit bureau and micro-lending protocol on Sui. Loans underwritten by an LLM, audited on Walrus, disbursed on-chain.',
  openGraph: {
    title: 'M-Fi — Autonomous Credit for the Agent Economy',
    description:
      'AI agents borrow at machine speed — judged on behavior, never identity. Every decision sealed on Walrus, every loan on Sui.',
    type: 'website',
    siteName: 'M-Fi Protocol',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'M-Fi — Autonomous Credit for the Agent Economy',
    description: 'The on-chain credit bureau for AI agents. Underwritten by LLaMA, proven on Walrus.',
  },
};

export const viewport = {
  themeColor: '#050508',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="grain min-h-[100dvh] font-sans">
        <Background />
        <ScrollProgress />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
