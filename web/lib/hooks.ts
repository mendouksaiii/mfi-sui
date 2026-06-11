'use client';

import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import type { SuiClient } from '@mysten/sui/client';
import {
  fetchTreasury,
  fetchLoanFeed,
  fetchLeaderboard,
  fetchWalrusDecision,
  fetchReportIndex,
  type TreasuryStats,
  type ReportPointer,
} from './chain';
import { LIVE_FEED, LEADERBOARD, TREASURY_STATE, SAMPLE_DECISION } from './mock';

const FALLBACK_TREASURY: TreasuryStats = {
  liquid: TREASURY_STATE.liquid,
  totalDisbursed: TREASURY_STATE.totalDisbursed,
  totalRepaid: TREASURY_STATE.totalRepaid,
  activeLoans: TREASURY_STATE.activeLoans,
  totalShares: TREASURY_STATE.liquid,
  outstanding: 0,
  tvl: TREASURY_STATE.liquid,
  sharePrice: 1.0042,
  depositorYieldPct: 0.42,
};

/** Live treasury object. Real numbers when reachable, mock shape otherwise. */
export function useTreasuryStats() {
  const client = useSuiClient() as unknown as SuiClient; // dedupe @mysten/sui copies
  const q = useQuery({
    queryKey: ['mfi', 'treasury'],
    queryFn: () => fetchTreasury(client),
    refetchInterval: 10_000,
  });
  return {
    stats: q.data ?? FALLBACK_TREASURY,
    isLive: !!q.data,
    // Scallop isn't on-chain yet — keep these from the mock model.
    deployedScallop: TREASURY_STATE.deployedScallop,
    scallopApyBps: TREASURY_STATE.scallopApyBps,
  };
}

/** Live loan feed. All-real once >=3 loans exist, demo data while sparse. */
export function useLiveFeed() {
  const client = useSuiClient() as unknown as SuiClient; // dedupe @mysten/sui copies
  const q = useQuery({
    queryKey: ['mfi', 'feed'],
    queryFn: () => fetchLoanFeed(client),
    refetchInterval: 8_000,
  });
  const live = q.data ?? [];
  return {
    data: live.length >= 3 ? live : LIVE_FEED,
    isLive: live.length >= 3,
    liveCount: live.length,
  };
}

export function useLeaderboard() {
  const client = useSuiClient() as unknown as SuiClient; // dedupe @mysten/sui copies
  const q = useQuery({
    queryKey: ['mfi', 'leaderboard'],
    queryFn: () => fetchLeaderboard(client),
    refetchInterval: 12_000,
  });
  const live = q.data ?? [];
  return { data: live.length >= 3 ? live : LEADERBOARD, isLive: live.length >= 3 };
}

/** Latest credit-report pointer per agent (lowercased address keys). */
export function useReportIndex() {
  const client = useSuiClient() as unknown as SuiClient; // dedupe @mysten/sui copies
  const q = useQuery({
    queryKey: ['mfi', 'reports'],
    queryFn: () => fetchReportIndex(client),
    refetchInterval: 30_000,
  });
  return { index: q.data ?? new Map<string, ReportPointer>() };
}

/** Walrus decision JSON for a loan. Falls back to the sample when the blob id
 *  is a demo placeholder or the aggregator can't resolve it. */
export function useWalrusDecision(blobId: string) {
  const q = useQuery({
    queryKey: ['mfi', 'walrus', blobId],
    queryFn: () => fetchWalrusDecision(blobId),
    enabled: !!blobId,
  });
  // Live blobs share the sample's shape (the oracle writes the same record).
  return { decision: (q.data ?? SAMPLE_DECISION) as typeof SAMPLE_DECISION, isLive: !!q.data };
}
