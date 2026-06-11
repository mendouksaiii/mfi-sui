import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { config } from './config.js';

export const client = new SuiClient({ url: getFullnodeUrl(config.network) });

/** The underwriter signer — holds the UnderwriterCap and pays gas. */
export const underwriter: Ed25519Keypair = Ed25519Keypair.deriveKeypair(
  config.underwriterMnemonic.trim(),
);

export const underwriterAddress = underwriter.getPublicKey().toSuiAddress();
