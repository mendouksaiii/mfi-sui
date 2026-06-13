import { config } from './config.js';
import { underwriter, underwriterAddress } from './sui.js';
import { withRetry } from './retry.js';
import { toBase64 } from '@mysten/sui/utils';
import type { AgentTelemetry } from './telemetry.js';
import type { RiskDecision } from './risk-engine.js';

/** The full, auditable underwriting record stored on Walrus. The returned
 *  blob ID is written onto the on-chain Loan object, so anyone can later
 *  fetch exactly what the model saw and decided. This is the Walrus track. */
export interface DecisionRecord {
  version: '1.0';
  timestamp: string;
  agentAddress: string;
  requestedAmount: number;
  purpose: string;
  telemetry: AgentTelemetry;
  decision: RiskDecision;
  model: string;
}

/** Ed25519 attestation over the decision payload. The signer is the
 *  underwriter — the same key that holds the UnderwriterCap on-chain — so a
 *  verifier can prove the decision text wasn't swapped after the fact:
 *  content-addressed (Walrus blob ID) + signed (this) + chain-pinned (Loan). */
export interface Attestation {
  algo: 'ed25519';
  signer: string; // Sui address of the underwriter
  publicKey: string; // base64
  signature: string; // base64, over the UTF-8 bytes of JSON.stringify(payload)
}

export type AttestedRecord<T> = T & { attestation: Attestation };

/** Sign a payload object exactly as it will round-trip through JSON, so a
 *  browser can re-derive the same bytes from the fetched blob and verify. */
async function attest<T extends object>(payload: T): Promise<AttestedRecord<T>> {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await underwriter.sign(bytes);
  return {
    ...payload,
    attestation: {
      algo: 'ed25519',
      signer: underwriterAddress,
      publicKey: underwriter.getPublicKey().toBase64(),
      signature: toBase64(signature),
    },
  };
}

/** Store any JSON payload on Walrus via the testnet HTTP publisher.
 *  Returns the Walrus blob ID. Retries transient network/5xx failures so a
 *  brief publisher hiccup doesn't drop a decision to an inline-only blob id. */
export async function storeBlob(body: object): Promise<string> {
  const url = `${config.walrusPublisher}/v1/blobs?epochs=${config.walrusEpochs}`;
  const payload = JSON.stringify(body);
  return withRetry(
    async () => {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      if (!res.ok) {
        // 5xx/429 are transient (withRetry will catch); 4xx re-throw as permanent.
        throw new Error(`Walrus publish failed: ${res.status} ${await res.text()}`);
      }
      const json: any = await res.json();
      // Publisher returns either a freshly created or an already-certified blob.
      const blobId: string | undefined =
        json?.newlyCreated?.blobObject?.blobId ?? json?.alreadyCertified?.blobId;
      if (!blobId) throw new Error(`Walrus response missing blobId: ${JSON.stringify(json)}`);
      return blobId;
    },
    { label: 'walrus publish' },
  );
}

/** Store a signed decision record on Walrus. Returns the Walrus blob ID. */
export async function storeDecision(record: DecisionRecord): Promise<string> {
  return storeBlob(await attest(record));
}

/** Store any signed payload (e.g. a credit report) on Walrus. */
export async function storeAttested<T extends object>(payload: T): Promise<string> {
  return storeBlob(await attest(payload));
}

/** Read a decision record back from Walrus by blob ID (audit endpoint). */
export async function readDecision(blobId: string): Promise<DecisionRecord> {
  const res = await fetch(`${config.walrusAggregator}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus read failed: ${res.status}`);
  return (await res.json()) as DecisionRecord;
}
