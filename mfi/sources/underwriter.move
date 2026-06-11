/// The M-Fi Underwriter: shared treasury + cap-gated lending logic.
///
/// `init` mints a single `UnderwriterCap` to the publisher (held off-chain by
/// the risk-oracle service) and shares the `ReputationRegistry`. The treasury
/// is generic over the stablecoin `T`, so the operator creates one per coin via
/// `create_treasury<T>` after publication (testnet: `mock_usdc::MOCK_USDC`,
/// mainnet: native USDC) — no code change required.
///
/// Disbursement is a single transaction: it takes coins from the treasury,
/// transfers them to the borrower, mints a soulbound `Loan` carrying the Walrus
/// decision-blob ID, updates reputation, and emits an event — all atomically.
module mfi::underwriter;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin};
use sui::event;
use std::string::String;
use mfi::loan::{Self, Loan};
use mfi::reputation::{Self, ReputationRegistry};

/// Treasury has less liquidity than the requested principal.
const EInsufficientLiquidity: u64 = 1;
/// Caller is not the borrower named on the loan.
const ENotBorrower: u64 = 2;
/// Requested principal exceeds the on-chain per-loan cap.
const ELoanTooLarge: u64 = 3;
/// Borrower's trust score is below the on-chain minimum.
const ETrustTooLow: u64 = 4;
/// Disbursing would push total outstanding debt past the exposure cap.
const EExposureCapReached: u64 = 5;
/// Lending is paused (circuit breaker engaged).
const EPaused: u64 = 6;
/// Repayment does not cover the loan principal.
const EInsufficientRepayment: u64 = 7;

/// Governance authority — cold key. Sets risk params, pauses lending, creates
/// treasuries, marks defaults. Kept offline / in a multisig, NOT on the oracle.
public struct AdminCap has key, store {
    id: UID,
}

/// The right to underwrite (disburse) loans only. Hot key held by the off-chain
/// risk oracle. A leak is bounded by the on-chain risk params and the pause
/// switch — it cannot change parameters or unpause.
public struct UnderwriterCap has key, store {
    id: UID,
}

/// Shared lending pool for a single stablecoin `T`.
///
/// The risk parameters are enforced by the module itself, so they bound what
/// the `UnderwriterCap` holder can do. Even a fully compromised oracle key
/// cannot disburse more than `max_loan` per loan, lend to a borrower below
/// `min_trust`, or push total live debt past `max_outstanding` — capping the
/// blast radius of a key leak.
public struct Treasury<phantom T> has key {
    id: UID,
    funds: Balance<T>,
    total_disbursed: u64,
    total_repaid: u64,
    active_loans: u64,
    // ── on-chain risk parameters ──
    max_loan: u64, // max principal per single loan
    min_trust: u64, // minimum trust score a borrower must carry
    max_outstanding: u64, // cap on total principal currently out on loan
    outstanding: u64, // live sum of un-repaid principal
    paused: bool, // circuit breaker — halts all disbursement
    // ── savings vault ──
    total_shares: u64, // total LP shares issued against the pool's net assets
}

/// A depositor's stake in the lending pool. Shares appreciate as borrowers
/// repay loan interest, so holding a position earns yield. Transferable.
public struct LpPosition<phantom T> has key, store {
    id: UID,
    shares: u64,
}

public struct TreasuryCreated has copy, drop {
    treasury_id: ID,
}

public struct Deposited has copy, drop {
    depositor: address,
    amount: u64,
    shares: u64,
}

public struct Withdrawn has copy, drop {
    depositor: address,
    amount: u64,
    shares: u64,
}

public struct LoanDisbursed has copy, drop {
    loan_id: ID,
    borrower: address,
    principal: u64,
    apy_bps: u64,
    trust_score: u64,
    decision_blob: String,
}

public struct LoanRepaid has copy, drop {
    loan_id: ID,
    borrower: address,
    amount: u64,
}

fun init(ctx: &mut TxContext) {
    // Both caps go to the publisher, who hands the UnderwriterCap to the hot
    // oracle wallet and keeps the AdminCap cold / in a multisig.
    transfer::transfer(AdminCap { id: object::new(ctx) }, ctx.sender());
    transfer::transfer(UnderwriterCap { id: object::new(ctx) }, ctx.sender());
    reputation::create_and_share(ctx);
}

/// Create and share a treasury for stablecoin `T` with its risk parameters.
/// Admin-gated. Params are in the coin's base units / trust units.
public fun create_treasury<T>(
    _: &AdminCap,
    max_loan: u64,
    min_trust: u64,
    max_outstanding: u64,
    ctx: &mut TxContext,
) {
    let treasury = Treasury<T> {
        id: object::new(ctx),
        funds: balance::zero<T>(),
        total_disbursed: 0,
        total_repaid: 0,
        active_loans: 0,
        max_loan,
        min_trust,
        max_outstanding,
        outstanding: 0,
        paused: false,
        total_shares: 0,
    };
    event::emit(TreasuryCreated { treasury_id: object::id(&treasury) });
    transfer::share_object(treasury);
}

/// Governance: update the risk parameters. Admin-gated.
public fun set_risk_params<T>(
    _: &AdminCap,
    treasury: &mut Treasury<T>,
    max_loan: u64,
    min_trust: u64,
    max_outstanding: u64,
) {
    treasury.max_loan = max_loan;
    treasury.min_trust = min_trust;
    treasury.max_outstanding = max_outstanding;
}

/// Circuit breaker: pause or resume all lending. Admin-gated.
public fun set_paused<T>(_: &AdminCap, treasury: &mut Treasury<T>, paused: bool) {
    treasury.paused = paused;
}

/// Total net assets backing LP shares: liquid funds plus principal currently
/// out on loan (expected to return). Loan interest, once repaid, lands in
/// `funds` and lifts assets-per-share — that surplus is depositor yield.
public fun total_assets<T>(treasury: &Treasury<T>): u64 {
    treasury.funds.value() + treasury.outstanding
}

/// Deposit into the lending pool and receive LP shares. Open to anyone —
/// agents and humans alike. This is the savings/deposit side of the bank.
public fun deposit<T>(treasury: &mut Treasury<T>, payment: Coin<T>, ctx: &mut TxContext): LpPosition<T> {
    let amount = payment.value();
    // Price shares against assets *before* this deposit is added.
    let assets = total_assets(treasury);
    let shares = if (treasury.total_shares == 0 || assets == 0) {
        amount
    } else {
        (((amount as u128) * (treasury.total_shares as u128)) / (assets as u128)) as u64
    };

    treasury.funds.join(payment.into_balance());
    treasury.total_shares = treasury.total_shares + shares;

    event::emit(Deposited { depositor: ctx.sender(), amount, shares });
    LpPosition { id: object::new(ctx), shares }
}

/// Redeem an LP position for the underlying assets, including accrued yield.
/// Withdrawal is limited to liquid funds — capital out on loan must return first.
public fun withdraw<T>(treasury: &mut Treasury<T>, position: LpPosition<T>, ctx: &mut TxContext): Coin<T> {
    let LpPosition { id, shares } = position;
    id.delete();

    let assets = total_assets(treasury);
    let amount = (((shares as u128) * (assets as u128)) / (treasury.total_shares as u128)) as u64;
    assert!(treasury.funds.value() >= amount, EInsufficientLiquidity);

    treasury.total_shares = treasury.total_shares - shares;
    event::emit(Withdrawn { depositor: ctx.sender(), amount, shares });
    coin::take(&mut treasury.funds, amount, ctx)
}

/// Underwrite and disburse a loan in one shot. Cap-gated: only the oracle that
/// holds `UnderwriterCap` can approve. The decision itself (model reasoning +
/// telemetry) lives in the Walrus blob referenced by `decision_blob`.
public fun disburse<T>(
    _: &UnderwriterCap,
    treasury: &mut Treasury<T>,
    registry: &mut ReputationRegistry,
    borrower: address,
    principal: u64,
    apy_bps: u64,
    trust_score: u64,
    decision_blob: String,
    purpose: String,
    ctx: &mut TxContext,
) {
    // ── on-chain risk checks: bound what the cap holder can do ──
    assert!(!treasury.paused, EPaused);
    assert!(principal <= treasury.max_loan, ELoanTooLarge);
    assert!(trust_score >= treasury.min_trust, ETrustTooLow);
    assert!(treasury.outstanding + principal <= treasury.max_outstanding, EExposureCapReached);
    assert!(treasury.funds.value() >= principal, EInsufficientLiquidity);

    let payout = coin::take(&mut treasury.funds, principal, ctx);
    transfer::public_transfer(payout, borrower);

    let loan = loan::new(borrower, principal, apy_bps, trust_score, decision_blob, purpose, ctx);
    let loan_id = object::id(&loan);

    treasury.total_disbursed = treasury.total_disbursed + principal;
    treasury.outstanding = treasury.outstanding + principal;
    treasury.active_loans = treasury.active_loans + 1;
    reputation::record_loan(registry, borrower, trust_score, principal);

    event::emit(LoanDisbursed {
        loan_id,
        borrower,
        principal,
        apy_bps,
        trust_score,
        decision_blob,
    });

    loan::bind(loan, borrower);
}

/// Borrower repays principal + interest. Only the named borrower may repay,
/// and the payment lands back in the treasury (where idle capital is later
/// routed to Scallop for yield).
public fun repay<T>(
    treasury: &mut Treasury<T>,
    registry: &mut ReputationRegistry,
    loan: &mut Loan,
    payment: Coin<T>,
    ctx: &mut TxContext,
) {
    assert!(loan::borrower(loan) == ctx.sender(), ENotBorrower);
    // Repayment must at least cover the principal — no clearing a loan with dust.
    let amount = payment.value();
    assert!(amount >= loan::principal(loan), EInsufficientRepayment);

    treasury.funds.join(payment.into_balance());
    treasury.total_repaid = treasury.total_repaid + amount;
    if (treasury.active_loans > 0) {
        treasury.active_loans = treasury.active_loans - 1;
    };
    // Free up the borrower's outstanding exposure.
    let principal = loan::principal(loan);
    treasury.outstanding = if (treasury.outstanding > principal) {
        treasury.outstanding - principal
    } else {
        0
    };

    loan::mark_repaid(loan);
    reputation::record_repayment(registry, loan::borrower(loan));

    event::emit(LoanRepaid {
        loan_id: object::id(loan),
        borrower: loan::borrower(loan),
        amount,
    });
}

// ─────────────── Read-only accessors ───────────────

public fun liquidity<T>(treasury: &Treasury<T>): u64 { treasury.funds.value() }
public fun total_disbursed<T>(treasury: &Treasury<T>): u64 { treasury.total_disbursed }
public fun total_repaid<T>(treasury: &Treasury<T>): u64 { treasury.total_repaid }
public fun active_loans<T>(treasury: &Treasury<T>): u64 { treasury.active_loans }
public fun outstanding<T>(treasury: &Treasury<T>): u64 { treasury.outstanding }
public fun max_loan<T>(treasury: &Treasury<T>): u64 { treasury.max_loan }
public fun min_trust<T>(treasury: &Treasury<T>): u64 { treasury.min_trust }
public fun max_outstanding<T>(treasury: &Treasury<T>): u64 { treasury.max_outstanding }
public fun is_paused<T>(treasury: &Treasury<T>): bool { treasury.paused }
public fun total_shares<T>(treasury: &Treasury<T>): u64 { treasury.total_shares }
public fun position_shares<T>(position: &LpPosition<T>): u64 { position.shares }

/// Value of one share, scaled by 1e6 (so 1_000_000 == par). Depositor yield is
/// visible as this rising above par as loan interest accrues to the pool.
public fun share_price_scaled<T>(treasury: &Treasury<T>): u64 {
    if (treasury.total_shares == 0) {
        1_000_000
    } else {
        (((total_assets(treasury) as u128) * 1_000_000) / (treasury.total_shares as u128)) as u64
    }
}

#[test_only]
/// Runs the otherwise-private `init` so tests can bootstrap the protocol.
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
