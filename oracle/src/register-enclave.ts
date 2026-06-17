import { Transaction } from '@mysten/sui/transactions';
import { fromHex } from '@mysten/sui/utils';
import { client, underwriter } from './sui.js';

const PKG = '0xfb8d17ec872e9d7774f6aa656e8ef05b53064cf69beeec0f031c05fd422b3cca';
const ADMIN = '0x72903444e769f37c3045efd28676605045d311dabd8bf9c948c70ccf3de12af8';
const CONFIG = '0xc597fd6e12f145e46f3f80ebb1391b6698ca8f834bb414c7698202198e1ce61d';
// RFC 8032 Ed25519 vector 2 — a known-good attested decision signature.
const PUBKEY = '3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c';
const MSG = '72';
const SIG = '92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00';
const PCR0 = 'a1b2c3d4e5f6'; // placeholder reproducible-build measurement (dev)
const AGENT = '0x0b0dc9bd08c903d31d00c88cc5ed6245b2e53a18a91286cec377644e63b0e5df';

(async () => {
  const tx = new Transaction();
  tx.moveCall({
    target: `${PKG}::enclave::register_enclave`,
    arguments: [tx.object(ADMIN), tx.object(CONFIG), tx.pure.vector('u8', Array.from(fromHex(PUBKEY))), tx.pure.vector('u8', Array.from(fromHex(PCR0)))],
  });
  tx.moveCall({
    target: `${PKG}::enclave::verify_decision`,
    arguments: [tx.object(CONFIG), tx.pure.address(AGENT), tx.pure.string('attested-demo-decision'), tx.pure.vector('u8', Array.from(fromHex(MSG))), tx.pure.vector('u8', Array.from(fromHex(SIG)))],
  });
  const r = await client.signAndExecuteTransaction({ signer: underwriter, transaction: tx, options: { showEffects: true } });
  await client.waitForTransaction({ digest: r.digest });
  console.log('register+verify:', r.effects?.status.status, r.digest);
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
