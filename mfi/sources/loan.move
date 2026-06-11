/// The on-chain loan record.
///
/// A `Loan` is **soulbound**: it has the `key` ability but not `store`, so it
/// can only be moved by functions inside this module (no `public_transfer`).
/// Once bound to a borrower it cannot be sold or transferred away — it is a
/// permanent, auditable credit record owned by the borrowing agent.
///
/// Each loan carries `decision_blob`: the Walrus blob ID of the underwriting
/// decision (LLM reasoning + the on-chain telemetry snapshot the model saw),
/// making every credit decision independently verifiable forever.
module mfi::loan;

use std::string::String;

/// Loan lifecycle states.
const STATUS_ACTIVE: u8 = 0;
const STATUS_REPAID: u8 = 1;
const STATUS_DEFAULTED: u8 = 2;

public struct Loan has key {
    id: UID,
    borrower: address,
    /// Principal disbursed, in the treasury coin's base units.
    principal: u64,
    /// Annualised interest, in basis points (e.g. 1800 = 18%).
    apy_bps: u64,
    /// Trust score (0-1000) assigned by the underwriter at issuance.
    trust_score: u64,
    /// Walrus blob ID of the underwriting decision payload.
    decision_blob: String,
    /// Free-text purpose supplied by the borrowing agent.
    purpose: String,
    issued_epoch: u64,
    status: u8,
}

/// Construct a loan. Package-visible so only `mfi::underwriter` can mint one.
public(package) fun new(
    borrower: address,
    principal: u64,
    apy_bps: u64,
    trust_score: u64,
    decision_blob: String,
    purpose: String,
    ctx: &mut TxContext,
): Loan {
    Loan {
        id: object::new(ctx),
        borrower,
        principal,
        apy_bps,
        trust_score,
        decision_blob,
        purpose,
        issued_epoch: ctx.epoch(),
        status: STATUS_ACTIVE,
    }
}

/// Soulbind the loan to its borrower. `transfer::transfer` (not public) keeps
/// the object non-transferable by the recipient.
public(package) fun bind(loan: Loan, borrower: address) {
    transfer::transfer(loan, borrower);
}

public(package) fun mark_repaid(loan: &mut Loan) {
    loan.status = STATUS_REPAID;
}

public(package) fun mark_defaulted(loan: &mut Loan) {
    loan.status = STATUS_DEFAULTED;
}

// ─────────────── Read-only accessors ───────────────

public fun borrower(loan: &Loan): address { loan.borrower }
public fun principal(loan: &Loan): u64 { loan.principal }
public fun apy_bps(loan: &Loan): u64 { loan.apy_bps }
public fun trust_score(loan: &Loan): u64 { loan.trust_score }
public fun decision_blob(loan: &Loan): String { loan.decision_blob }
public fun purpose(loan: &Loan): String { loan.purpose }
public fun issued_epoch(loan: &Loan): u64 { loan.issued_epoch }
public fun status(loan: &Loan): u8 { loan.status }
public fun is_active(loan: &Loan): bool { loan.status == STATUS_ACTIVE }
