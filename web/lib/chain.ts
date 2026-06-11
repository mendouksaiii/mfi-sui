import type { SuiClient } from '@mysten/sui/client';
import { MFI } from './config';
import { AGENTS, LIVE_FEED } from './mock';
import type { LoanEvent, LeaderRow, LoanStatus, AgentProfile } from './mock';

// ─────────────── Event type tags ───────────────
const EV = {
  disbursed: `${MFI.packageId}::underwriter::LoanDisbursed`,
  repaid: `${MFI.packageId}::underwriter::LoanRepaid`,
  reputation: `${MFI.packageId}::reputation::ReputationUpdated`,
};

// Map known on-chain borrower addresses back to rich agent personas / purposes.
const PERSONA = new Map(AGENTS.map((a) => [a.address.toLowerCase(), a]));
const PURPOSE = new Map(LIVE_FEED.map((l) => [l.agent.address.toLowerCase(), l.purpose]));

const agentFromAddr = (address: string): AgentProfile =>
  PERSONA.get(address.toLowerCase()) ?? {
    id: `agent-${address.slice(2, 6)}`,
    address,
    job: 'Autonomous agent',
  };

const purposeFor = (address: string): string =>
  PURPOSE.get(address.toLowerCase()) ?? 'On-chain loan request';

const relTime = (ms: number): string => {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
};

// ─────────────── Treasury ───────────────
export interface TreasuryStats {
  liquid: number;
  totalDisbursed: number;
  totalRepaid: number;
  activeLoans: number;
  // savings vault
  totalShares: number;
  outstanding: number;
  tvl: number; // total assets = liquid + outstanding
  sharePrice: number; // 1.0 == par; > 1 means depositors have earned yield
  depositorYieldPct: number; // (sharePrice - 1) * 100
}

export async function fetchTreasury(client: SuiClient): Promise<TreasuryStats | null> {
  const res = await client.getObject({ id: MFI.treasuryId, options: { showContent: true } });
  const content = res.data?.content;
  if (!content || content.dataType !== 'moveObject') return null;
  const f = content.fields as Record<string, unknown>;
  const liquid = Number(f.funds ?? 0);
  const outstanding = Number(f.outstanding ?? 0);
  const totalShares = Number(f.total_shares ?? 0);
  const tvl = liquid + outstanding;
  const sharePrice = totalShares > 0 ? tvl / totalShares : 1;
  return {
    liquid,
    totalDisbursed: Number(f.total_disbursed ?? 0),
    totalRepaid: Number(f.total_repaid ?? 0),
    activeLoans: Number(f.active_loans ?? 0),
    totalShares,
    outstanding,
    tvl,
    sharePrice,
    depositorYieldPct: (sharePrice - 1) * 100,
  };
}

// ─────────────── Loan feed (events) ───────────────
export async function fetchLoanFeed(client: SuiClient, limit = 25): Promise<LoanEvent[]> {
  const [disbursed, repaid] = await Promise.all([
    client.queryEvents({ query: { MoveEventType: EV.disbursed }, limit, order: 'descending' }),
    client.queryEvents({ query: { MoveEventType: EV.repaid }, limit, order: 'descending' }),
  ]);

  const repaidLoanIds = new Set(
    repaid.data.map((e) => (e.parsedJson as { loan_id?: string })?.loan_id).filter(Boolean) as string[],
  );

  return disbursed.data.map((e) => {
    const j = e.parsedJson as {
      loan_id: string;
      borrower: string;
      principal: string;
      apy_bps: string;
      trust_score: string;
      decision_blob: string;
    };
    const status: LoanStatus = repaidLoanIds.has(j.loan_id) ? 'REPAID' : 'ACTIVE';
    return {
      loanId: j.loan_id,
      agent: agentFromAddr(j.borrower),
      principal: Number(j.principal),
      apyBps: Number(j.apy_bps),
      trustScore: Number(j.trust_score),
      status,
      decisionBlob: j.decision_blob,
      purpose: purposeFor(j.borrower),
      tsAgo: e.timestampMs ? relTime(Number(e.timestampMs)) : '—',
    };
  });
}

// ─────────────── Reputation leaderboard (events) ───────────────
export async function fetchLeaderboard(client: SuiClient, limit = 50): Promise<LeaderRow[]> {
  const res = await client.queryEvents({
    query: { MoveEventType: EV.reputation },
    limit,
    order: 'descending',
  });

  // Latest event per agent wins (events are newest-first).
  const seen = new Map<string, LeaderRow>();
  for (const e of res.data) {
    const j = e.parsedJson as {
      agent: string;
      trust_score: string;
      loans_taken: string;
      loans_repaid: string;
      total_borrowed: string;
    };
    if (seen.has(j.agent)) continue;
    seen.set(j.agent, {
      agent: agentFromAddr(j.agent),
      trustScore: Number(j.trust_score),
      loansTaken: Number(j.loans_taken),
      loansRepaid: Number(j.loans_repaid),
      totalBorrowed: Number(j.total_borrowed),
    });
  }
  return [...seen.values()].sort((a, b) => b.trustScore - a.trustScore).slice(0, 10);
}

// ─────────────── Credit reports (ReportPublished events) ───────────────
export interface ReportPointer {
  blobId: string;
  sequence: number;
  publishedMs: number;
}

/** Latest credit-report blob per agent, from the mfi_reports registry events. */
export async function fetchReportIndex(client: SuiClient): Promise<Map<string, ReportPointer>> {
  const res = await client.queryEvents({
    query: { MoveEventType: `${MFI.reportsPackageId}::reports::ReportPublished` },
    limit: 50,
    order: 'descending',
  });
  const index = new Map<string, ReportPointer>();
  for (const e of res.data) {
    const j = e.parsedJson as { agent: string; blob_id: string; sequence: string; published_ms: string };
    if (index.has(j.agent.toLowerCase())) continue; // newest-first → first wins
    index.set(j.agent.toLowerCase(), {
      blobId: j.blob_id,
      sequence: Number(j.sequence),
      publishedMs: Number(j.published_ms),
    });
  }
  return index;
}

// ─────────────── Walrus decision blob ───────────────
export async function fetchWalrusDecision(blobId: string): Promise<unknown | null> {
  // Real Walrus blob ids are ~43-char base64url. Demo placeholders won't resolve.
  if (!/^[A-Za-z0-9_-]{40,}$/.test(blobId)) return null;
  try {
    const r = await fetch(`${MFI.walrusAggregator}/v1/blobs/${blobId}`);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}
