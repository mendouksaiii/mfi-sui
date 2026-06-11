import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';
import { MFI } from './config';
import type { LoanEvent } from './mock';

/** Result of one verification step. */
export interface VerifyStep {
  id: 'available' | 'signed' | 'terms';
  label: string;
  ok: boolean;
  detail: string;
}

export interface VerifyResult {
  steps: VerifyStep[];
  allOk: boolean;
}

interface Attestation {
  algo: string;
  signer: string;
  publicKey: string;
  signature: string;
}

/** Verify the Ed25519 attestation on any signed Walrus payload (decision or
 *  credit report). Returns whether the signature is valid AND the signer is
 *  the underwriter. */
export async function verifyAttestation(
  blob: Record<string, unknown>,
): Promise<{ ok: boolean; reason: string }> {
  const { attestation, ...payload } = blob as { attestation?: Attestation } & Record<string, unknown>;
  if (!attestation) return { ok: false, reason: 'unsigned (sealed before signing was enabled)' };
  try {
    const pk = new Ed25519PublicKey(fromBase64(attestation.publicKey));
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    const sigOk = await pk.verify(bytes, fromBase64(attestation.signature));
    if (!sigOk) return { ok: false, reason: 'signature does not match payload' };
    if (pk.toSuiAddress() !== MFI.underwriter) return { ok: false, reason: 'signer is not the underwriter' };
    return { ok: true, reason: `signed by the bureau · ${MFI.underwriter.slice(0, 10)}…` };
  } catch {
    return { ok: false, reason: 'malformed attestation' };
  }
}

/**
 * Independently verify a Walrus-sealed underwriting decision, fully
 * client-side:
 *
 *  1. AVAILABLE — the blob ID pinned on the on-chain Loan resolves on a public
 *     Walrus aggregator. Blob IDs are content-derived, so the bytes served are
 *     the bytes that were sealed.
 *  2. SIGNED — the decision payload carries an Ed25519 signature; we re-derive
 *     the signed bytes from the fetched JSON and verify the signature AND that
 *     the signer is the underwriter (the on-chain UnderwriterCap holder).
 *  3. TERMS MATCH — the decision inside the blob agrees with the loan terms
 *     recorded on-chain (borrower, trust score).
 */
export async function verifyDecision(loan: LoanEvent): Promise<VerifyResult> {
  const steps: VerifyStep[] = [];

  // 1. availability via content-addressed fetch
  let blob: Record<string, unknown> | null = null;
  try {
    const r = await fetch(`${MFI.walrusAggregator}/v1/blobs/${loan.decisionBlob}`);
    if (r.ok) {
      blob = (await r.json()) as Record<string, unknown>;
      steps.push({
        id: 'available',
        label: 'Blob available on Walrus',
        ok: true,
        detail: `HTTP 200 from public aggregator · content-addressed ID ${loan.decisionBlob.slice(0, 12)}…`,
      });
    } else {
      steps.push({
        id: 'available',
        label: 'Blob available on Walrus',
        ok: false,
        detail: `Aggregator returned ${r.status}`,
      });
    }
  } catch {
    steps.push({
      id: 'available',
      label: 'Blob available on Walrus',
      ok: false,
      detail: 'Aggregator unreachable',
    });
  }
  if (!blob) return { steps, allOk: false };

  // 2. signature — strip the attestation, re-derive the exact signed bytes
  const { attestation, ...payload } = blob as { attestation?: Attestation } & Record<string, unknown>;
  if (!attestation) {
    steps.push({
      id: 'signed',
      label: 'Signed by the underwriter',
      ok: false,
      detail: 'No attestation in blob (sealed before signing was enabled)',
    });
  } else {
    try {
      const pk = new Ed25519PublicKey(fromBase64(attestation.publicKey));
      const derived = pk.toSuiAddress();
      const bytes = new TextEncoder().encode(JSON.stringify(payload));
      const sigOk = await pk.verify(bytes, fromBase64(attestation.signature));
      const signerOk = derived === MFI.underwriter && attestation.signer === MFI.underwriter;
      steps.push({
        id: 'signed',
        label: 'Signed by the underwriter',
        ok: sigOk && signerOk,
        detail:
          sigOk && signerOk
            ? `Ed25519 signature valid · signer ${derived.slice(0, 10)}… holds the UnderwriterCap`
            : sigOk
              ? `Signature valid but signer ${derived.slice(0, 10)}… is not the underwriter`
              : 'Signature does not match payload bytes',
      });
    } catch {
      steps.push({
        id: 'signed',
        label: 'Signed by the underwriter',
        ok: false,
        detail: 'Malformed attestation',
      });
    }
  }

  // 3. terms vs the on-chain loan event
  const decision = (payload as { decision?: { trustScore?: number } }).decision;
  const agentAddress = (payload as { agentAddress?: string }).agentAddress;
  const trustOk = decision?.trustScore === loan.trustScore;
  const borrowerOk =
    typeof agentAddress === 'string' && agentAddress.toLowerCase() === loan.agent.address.toLowerCase();
  steps.push({
    id: 'terms',
    label: 'Terms match the on-chain loan',
    ok: trustOk && borrowerOk,
    detail:
      trustOk && borrowerOk
        ? `trust ${loan.trustScore} and borrower ${loan.agent.address.slice(0, 10)}… agree with the Loan object`
        : !borrowerOk
          ? 'Borrower in blob differs from on-chain loan'
          : `Trust in blob (${decision?.trustScore}) differs from on-chain (${loan.trustScore})`,
  });

  return { steps, allOk: steps.every((s) => s.ok) };
}
