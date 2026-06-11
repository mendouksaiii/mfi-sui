// Mock data mirrors the on-chain event/object shapes (LoanDisbursed, LoanRepaid,
// ReputationRegistry.Record). The live build swaps these for real RPC reads;
// the component contracts stay identical.

export type LoanStatus = 'ACTIVE' | 'REPAID' | 'DEFAULTED';

export interface AgentProfile {
  id: string; // human handle, e.g. agent-77-scraping
  address: string;
  job: string;
}

export interface LoanEvent {
  loanId: string;
  agent: AgentProfile;
  principal: number; // base units (6 decimals)
  apyBps: number;
  trustScore: number;
  status: LoanStatus;
  decisionBlob: string; // Walrus blob id
  purpose: string;
  tsAgo: string; // relative time label
}

export interface LeaderRow {
  agent: AgentProfile;
  trustScore: number;
  loansTaken: number;
  loansRepaid: number;
  totalBorrowed: number; // base units
}

const A = (id: string, address: string, job: string): AgentProfile => ({ id, address, job });

export const AGENTS: AgentProfile[] = [
  A('agent-77-scraping', '0x0a9e0000000000000000000000000000000000000000000000000000000000a1', 'Web3 Data Scraping'),
  A('agent-42-arbitrage', '0x7c4419bf03ad5c8e0021d6f8b2e3a9417dd8c6b1004fe2aa9931cc70e5d20b88', 'Cross-DEX Arbitrage'),
  A('agent-91-oracle', '0x91aa31c20bb7e4419ff0026d7b6a8c5512de9930ab7740a5b1c0e2553d9af004', 'Oracle Price Feed'),
  A('agent-15-yield', '0x15de4471a0c2b6f9938e0044ab7d6c1129ff0072e5a8401bb9c3702e6df1a955', 'Scallop Yield Rebalance'),
  A('agent-63-nft', '0x63bb70114af0d2e5b9a30058cd7e6f2231aa9905bf7e4480ac1d20e3f5b6c011', 'Time-boxed NFT Mint'),
  A('agent-08-relayer', '0x08cc41a9f0b3e7d24a980031bd6c5e1140aa8870ff5e2390cb1a40d2e7f3a922', 'Cross-chain Relayer'),
];

export const LIVE_FEED: LoanEvent[] = [
  {
    loanId: '0x3110edef51534dc997dcc0201d9f14c570595861cb70427fb507d0099c4797ae',
    agent: AGENTS[1], principal: 25_000_000, apyBps: 1800, trustScore: 720,
    status: 'ACTIVE', decisionBlob: 'aXc7Kp2_walrus_blob_8810', purpose: 'Cross-DEX arbitrage gas — 3.2% spread on Cetus/Turbos', tsAgo: '12s',
  },
  {
    loanId: '0x77fa0021bd6c5e1140aa8870ff5e2390cb1a40d2e7f3a92208cc41a9f0b3e7d2',
    agent: AGENTS[0], principal: 5_000_000, apyBps: 1000, trustScore: 905,
    status: 'REPAID', decisionBlob: 'Lm9Qr4x_walrus_blob_8807', purpose: 'Real-time scraping job — revenue-positive', tsAgo: '48s',
  },
  {
    loanId: '0x91aa31c20bb7e4419ff0026d7b6a8c5512de9930ab7740a5b1c0e2553d9af004',
    agent: AGENTS[2], principal: 10_000_000, apyBps: 1200, trustScore: 812,
    status: 'ACTIVE', decisionBlob: 'Zt3Wn8y_walrus_blob_8804', purpose: '24h Chainlink-style feed gas — critical infra', tsAgo: '1m 30s',
  },
  {
    loanId: '0x15de4471a0c2b6f9938e0044ab7d6c1129ff0072e5a8401bb9c3702e6df1a955',
    agent: AGENTS[3], principal: 50_000_000, apyBps: 1900, trustScore: 640,
    status: 'ACTIVE', decisionBlob: 'Pb6Vc1q_walrus_blob_8799', purpose: 'Rebalance Scallop position to higher-APY pool', tsAgo: '2m 11s',
  },
  {
    loanId: '0x63bb70114af0d2e5b9a30058cd7e6f2231aa9905bf7e4480ac1d20e3f5b6c011',
    agent: AGENTS[4], principal: 15_000_000, apyBps: 1500, trustScore: 558,
    status: 'REPAID', decisionBlob: 'Hd2Jf9k_walrus_blob_8791', purpose: 'Mint + list time-sensitive collection', tsAgo: '3m 02s',
  },
  {
    loanId: '0x08cc41a9f0b3e7d24a980031bd6c5e1140aa8870ff5e2390cb1a40d2e7f3a922',
    agent: AGENTS[5], principal: 8_000_000, apyBps: 0, trustScore: 410,
    status: 'DEFAULTED', decisionBlob: 'Wq8Rt2m_walrus_blob_8785', purpose: 'Relayer gas top-up — denied, insufficient history', tsAgo: '4m 40s',
  },
];

export const LEADERBOARD: LeaderRow[] = [
  { agent: AGENTS[0], trustScore: 905, loansTaken: 38, loansRepaid: 38, totalBorrowed: 412_000_000 },
  { agent: AGENTS[2], trustScore: 812, loansTaken: 27, loansRepaid: 26, totalBorrowed: 305_400_000 },
  { agent: AGENTS[1], trustScore: 720, loansTaken: 19, loansRepaid: 17, totalBorrowed: 188_250_000 },
  { agent: AGENTS[3], trustScore: 640, loansTaken: 12, loansRepaid: 10, totalBorrowed: 96_500_000 },
  { agent: AGENTS[4], trustScore: 558, loansTaken: 9, loansRepaid: 7, totalBorrowed: 47_200_000 },
];

export const TREASURY_STATE = {
  liquid: 9_975_000_000,
  deployedScallop: 4_120_000_000,
  totalDisbursed: 1_284_500_000,
  totalRepaid: 1_259_500_000,
  activeLoans: 14,
  scallopApyBps: 742,
};

// A decision record as stored on Walrus, surfaced in the audit explorer.
export const SAMPLE_DECISION = {
  version: '1.0',
  timestamp: '2026-06-08T11:42:07.220Z',
  agentAddress: AGENTS[1].address,
  requestedAmount: 25,
  purpose: 'Cross-DEX arbitrage gas — 3.2% spread on Cetus/Turbos',
  model: 'llama-3.1-8b-instant',
  telemetry: {
    address: AGENTS[1].address,
    suiBalance: '0.418204',
    usdcBalance: '6.40',
    ownedObjects: 23,
    txCount: 41,
    reputationLayer: 'High',
  },
  decision: {
    decision: 'APPROVE',
    reasoning:
      'Agent presents 41 historical transactions and 23 owned objects, placing it in the High reputation layer. Requested 25 USDC is well within prudent exposure given a 6.40 USDC standing balance and a revenue-positive arbitrage thesis. Approved at 18% APY.',
    confidence: 0.88,
    trustScore: 720,
  },
};
