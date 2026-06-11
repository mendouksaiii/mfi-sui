/**
 * M-Fi credit reports — the bureau's product.
 *
 * A credit report aggregates an agent's complete on-chain borrowing history,
 * trust trajectory, and the Walrus blob IDs of every underwriting decision as
 * evidence links. The report itself is Ed25519-signed and stored on Walrus,
 * and its blob ID is published to the on-chain ReportRegistry — making an
 * agent's creditworthiness a portable, verifiable document any protocol can
 * resolve and audit, with zero trust in M-Fi's servers.
 */
import { Transaction } from '@mysten/sui/transactions';
import { client, underwriter, underwriterAddress } from './sui.js';
import { config, fromBaseUnits } from './config.js';
import { storeAttested } from './walrus.js';

export interface CreditReport {
  version: '1.0';
  type: 'mfi-credit-report';
  generatedAt: string;
  bureau: string; // underwriter address
  agent: { address: string; handle: string; job: string };
  standing: {
    trustScore: number;
    loansTaken: number;
    loansRepaid: number;
    repaymentRatePct: number;
    totalBorrowedUsdc: number;
  };
  /** Trust trajectory, oldest → newest. */
  history: Array<{ at: string; trustScore: number; loansRepaid: number }>;
  /** Evidence: recent loans with their Walrus decision blob IDs. */
  evidence: Array<{ loanId: string; principalUsdc: number; decisionBlob: string; at: string }>;
}

/** Compile an agent's credit report from on-chain events only. */
export async function compileReport(agent: {
  address: string;
  handle: string;
  job: string;
}): Promise<CreditReport | null> {
  const [repEvents, loanEvents] = await Promise.all([
    client.queryEvents({
      query: { MoveEventType: `${config.packageId}::reputation::ReputationUpdated` },
      order: 'descending',
      limit: 50,
    }),
    client.queryEvents({
      query: { MoveEventType: `${config.packageId}::underwriter::LoanDisbursed` },
      order: 'descending',
      limit: 50,
    }),
  ]);

  const mine = repEvents.data.filter((e) => (e.parsedJson as any).agent === agent.address);
  if (mine.length === 0) return null; // no history yet

  const latest: any = mine[0].parsedJson;
  const history = [...mine]
    .reverse()
    .map((e) => ({
      at: new Date(Number(e.timestampMs)).toISOString(),
      trustScore: Number((e.parsedJson as any).trust_score),
      loansRepaid: Number((e.parsedJson as any).loans_repaid),
    }));

  const evidence = loanEvents.data
    .filter((e) => (e.parsedJson as any).borrower === agent.address)
    .slice(0, 20)
    .map((e) => {
      const j: any = e.parsedJson;
      return {
        loanId: j.loan_id as string,
        principalUsdc: fromBaseUnits(Number(j.principal)),
        decisionBlob: j.decision_blob as string,
        at: new Date(Number(e.timestampMs)).toISOString(),
      };
    });

  const taken = Number(latest.loans_taken);
  const repaid = Number(latest.loans_repaid);
  return {
    version: '1.0',
    type: 'mfi-credit-report',
    generatedAt: new Date().toISOString(),
    bureau: underwriterAddress,
    agent,
    standing: {
      trustScore: Number(latest.trust_score),
      loansTaken: taken,
      loansRepaid: repaid,
      repaymentRatePct: taken > 0 ? Math.round((repaid / taken) * 1000) / 10 : 0,
      totalBorrowedUsdc: fromBaseUnits(Number(latest.total_borrowed)),
    },
    history,
    evidence,
  };
}

/** Compile → sign → seal on Walrus → publish blob ID to the on-chain registry. */
export async function publishReport(agent: {
  address: string;
  handle: string;
  job: string;
}): Promise<{ blobId: string; digest: string } | null> {
  if (!config.reportsPackageId || !config.reportsRegistryId || !config.bureauCapId) return null;

  const report = await compileReport(agent);
  if (!report) return null;

  const blobId = await storeAttested(report);

  const tx = new Transaction();
  tx.moveCall({
    target: `${config.reportsPackageId}::reports::publish`,
    arguments: [
      tx.object(config.bureauCapId),
      tx.object(config.reportsRegistryId),
      tx.pure.address(agent.address),
      tx.pure.string(blobId),
      tx.pure.u64(Date.now()),
    ],
  });
  const r = await client.signAndExecuteTransaction({
    signer: underwriter,
    transaction: tx,
    options: { showEffects: true },
  });
  await client.waitForTransaction({ digest: r.digest });
  if (r.effects?.status.status !== 'success') {
    throw new Error(`report publish failed: ${r.effects?.status.error}`);
  }
  return { blobId, digest: r.digest };
}
