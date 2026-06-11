import { Transaction } from '@mysten/sui/transactions';
import { client, underwriter } from './sui.js';
import { config } from './config.js';

export interface DisburseResult {
  digest: string;
  loanId?: string;
  success: boolean;
  error?: string;
}

/** Build + sign + execute the cap-gated disbursement PTB.
 *  One transaction: take coins from treasury -> transfer to borrower ->
 *  mint soulbound Loan (with Walrus blob id) -> bump reputation -> emit. */
export async function disburse(params: {
  borrower: string;
  principalBaseUnits: number;
  apyBps: number;
  trustScore: number;
  decisionBlob: string;
  purpose: string;
}): Promise<DisburseResult> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::underwriter::disburse`,
    typeArguments: [config.coinType],
    arguments: [
      tx.object(config.underwriterCapId),
      tx.object(config.treasuryId),
      tx.object(config.registryId),
      tx.pure.address(params.borrower),
      tx.pure.u64(params.principalBaseUnits),
      tx.pure.u64(params.apyBps),
      tx.pure.u64(params.trustScore),
      tx.pure.string(params.decisionBlob),
      tx.pure.string(params.purpose),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    signer: underwriter,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });
  await client.waitForTransaction({ digest: result.digest });

  const status = result.effects?.status.status;
  if (status !== 'success') {
    return { digest: result.digest, success: false, error: result.effects?.status.error };
  }

  // The newly created soulbound Loan is the created object owned by the borrower.
  const loanChange = result.objectChanges?.find(
    (c) => c.type === 'created' && c.objectType.endsWith('::loan::Loan'),
  ) as { objectId: string } | undefined;

  return { digest: result.digest, loanId: loanChange?.objectId, success: true };
}
