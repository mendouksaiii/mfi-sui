/// On-chain verifier for attested off-chain AI underwriting (Sui Nautilus model).
///
/// M-Fi's risk decisions are computed off-chain by an LLM. Walrus already proves
/// *what* was decided; this module is the other half — proving the decision was
/// produced by the *attested* underwriting enclave, not a swapped-in server.
///
/// Design (Nautilus, https://docs.sui.io/concepts/cryptography/nautilus):
///   1. The LLM risk engine runs inside a TEE (AWS Nitro Enclave) with a
///      reproducible build. The enclave emits an attestation document carrying
///      its PCR measurements and an ephemeral Ed25519 public key.
///   2. Sui verifies that attestation once (custom PCR verification, live on
///      mainnet since Feb 2026) and registers the enclave key in `EnclaveConfig`.
///   3. Every decision the enclave emits is Ed25519-signed. Before the protocol
///      disburses, `verify_decision` checks that signature on-chain — so a loan
///      can only settle behind a decision from the attested enclave.
///
/// This module implements the live, tested on-chain verification half. The TEE
/// deployment + attestation-document parsing is the Nautilus integration step
/// on the roadmap; here the enclave key is admin-registered as a stand-in for
/// the verified-attestation handshake. The verification math is real.
module mfi_verifier::enclave;

use std::string::String;
use sui::ed25519;
use sui::event;

/// Signature did not verify against the registered enclave key.
const EBadSignature: u64 = 0;
/// No enclave key has been registered yet.
const ENoEnclave: u64 = 1;

/// Held by the bureau operator; in production, gating register_enclave is
/// replaced by a verified Nautilus attestation document.
public struct AdminCap has key, store { id: UID }

/// Shared record of the currently-attested underwriting enclave.
public struct EnclaveConfig has key {
    id: UID,
    /// Ed25519 public key the attested enclave signs decisions with (32 bytes).
    enclave_pubkey: vector<u8>,
    /// PCR0 digest of the reproducible enclave build — recorded for auditors.
    pcr0: vector<u8>,
    /// Count of decisions verified on-chain.
    verified: u64,
}

public struct EnclaveRegistered has copy, drop {
    enclave_pubkey: vector<u8>,
    pcr0: vector<u8>,
}

public struct DecisionVerified has copy, drop {
    agent: address,
    decision_blob: String,
    verified_total: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(EnclaveConfig {
        id: object::new(ctx),
        enclave_pubkey: vector::empty(),
        pcr0: vector::empty(),
        verified: 0,
    });
    transfer::public_transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
}

/// Register (or rotate) the attested enclave's signing key + PCR0 measurement.
public fun register_enclave(
    _: &AdminCap,
    config: &mut EnclaveConfig,
    enclave_pubkey: vector<u8>,
    pcr0: vector<u8>,
) {
    config.enclave_pubkey = enclave_pubkey;
    config.pcr0 = pcr0;
    event::emit(EnclaveRegistered { enclave_pubkey, pcr0 });
}

/// Verify the enclave's Ed25519 signature over a decision message. The
/// underwriter PTB calls this and aborts if it fails, so a loan can only be
/// disbursed behind a decision the attested enclave actually produced.
/// Returns `true` on success; aborts with `EBadSignature` otherwise.
public fun verify_decision(
    config: &mut EnclaveConfig,
    agent: address,
    decision_blob: String,
    message: vector<u8>,
    signature: vector<u8>,
): bool {
    assert!(!config.enclave_pubkey.is_empty(), ENoEnclave);
    let ok = ed25519::ed25519_verify(&signature, &config.enclave_pubkey, &message);
    assert!(ok, EBadSignature);
    config.verified = config.verified + 1;
    event::emit(DecisionVerified { agent, decision_blob, verified_total: config.verified });
    true
}

public fun verified_count(config: &EnclaveConfig): u64 { config.verified }

public fun enclave_pubkey(config: &EnclaveConfig): vector<u8> { config.enclave_pubkey }

// ─────────────── tests ───────────────
// RFC 8032 Ed25519 test vector 2 (1-byte message 0x72) — the same scheme
// sui::ed25519 verifies, so this exercises the real on-chain crypto path.
#[test_only]
const TEST_PK: vector<u8> = x"3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c";
#[test_only]
const TEST_MSG: vector<u8> = x"72";
#[test_only]
const TEST_SIG: vector<u8> = x"92a009a9f0d4cab8720e820b5f642540a2b27b5416503f8fb3762223ebdb69da085ac1e43e15996e458f3613d0f11d8c387b2eaeb4302aeeb00d291612bb0c00";

#[test_only]
fun fresh(ctx: &mut TxContext): EnclaveConfig {
    EnclaveConfig { id: object::new(ctx), enclave_pubkey: TEST_PK, pcr0: x"abcd", verified: 0 }
}

#[test_only]
fun burn(config: EnclaveConfig) {
    let EnclaveConfig { id, enclave_pubkey: _, pcr0: _, verified: _ } = config;
    id.delete();
}

#[test]
fun test_verifies_attested_decision() {
    let mut ctx = tx_context::dummy();
    let mut config = fresh(&mut ctx);
    let ok = verify_decision(&mut config, @0xA11CE, b"blobZ".to_string(), TEST_MSG, TEST_SIG);
    assert!(ok && verified_count(&config) == 1);
    burn(config);
}

#[test, expected_failure(abort_code = EBadSignature)]
fun test_rejects_tampered_signature() {
    let mut ctx = tx_context::dummy();
    let mut config = fresh(&mut ctx);
    // flip the first signature byte — must fail verification
    let mut bad = TEST_SIG;
    *bad.borrow_mut(0) = 0x00;
    verify_decision(&mut config, @0xA11CE, b"blobZ".to_string(), TEST_MSG, bad);
    burn(config);
}

#[test, expected_failure(abort_code = ENoEnclave)]
fun test_rejects_before_registration() {
    let mut ctx = tx_context::dummy();
    let mut config = EnclaveConfig { id: object::new(&mut ctx), enclave_pubkey: vector::empty(), pcr0: vector::empty(), verified: 0 };
    verify_decision(&mut config, @0xA11CE, b"x".to_string(), TEST_MSG, TEST_SIG);
    burn(config);
}
