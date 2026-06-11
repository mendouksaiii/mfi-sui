#[test_only]
module mfi::underwriter_tests;

use sui::test_scenario::{Self as ts, Scenario};
use sui::coin::{Self, Coin};
use std::string;
use mfi::underwriter::{Self, AdminCap, UnderwriterCap, Treasury, LpPosition};
use mfi::reputation::{Self, ReputationRegistry};
use mfi::loan::{Self, Loan};
use mfi::mock_usdc::MOCK_USDC;

const ADMIN: address = @0xA;
const BORROWER: address = @0xB;

const STATUS_REPAID: u8 = 1;

/// Full lifecycle: bootstrap -> seed treasury -> disburse -> repay,
/// asserting treasury accounting, the soulbound loan, and reputation.
#[test]
fun test_disburse_and_repay() {
    let mut scenario = ts::begin(ADMIN);

    // tx0: bootstrap the underwriter (UnderwriterCap -> ADMIN, shared registry).
    underwriter::init_for_testing(scenario.ctx());

    // tx1: create a MOCK_USDC treasury (cap-gated).
    scenario.next_tx(ADMIN);
    {
        let admin = scenario.take_from_sender<AdminCap>();
        // max_loan 1.0 mUSDC, min_trust 0, max_outstanding 1000 mUSDC.
        underwriter::create_treasury<MOCK_USDC>(&admin, 1_000_000, 0, 1_000_000_000, scenario.ctx());
        scenario.return_to_sender(admin);
    };

    // tx2: seed the treasury with 1.0 mUSDC of liquidity.
    scenario.next_tx(ADMIN);
    {
        let mut treasury = scenario.take_shared<Treasury<MOCK_USDC>>();
        let coins = coin::mint_for_testing<MOCK_USDC>(1_000_000, scenario.ctx());
        transfer::public_transfer(underwriter::deposit(&mut treasury, coins, scenario.ctx()), ADMIN);
        assert!(underwriter::liquidity(&treasury) == 1_000_000, 0);
        ts::return_shared(treasury);
    };

    // tx3: underwrite + disburse 0.5 mUSDC to the borrower.
    scenario.next_tx(ADMIN);
    {
        let cap = scenario.take_from_sender<UnderwriterCap>();
        let mut treasury = scenario.take_shared<Treasury<MOCK_USDC>>();
        let mut registry = scenario.take_shared<ReputationRegistry>();
        underwriter::disburse(
            &cap,
            &mut treasury,
            &mut registry,
            BORROWER,
            500_000,
            1800, // 18% APY
            720, // trust score
            string::utf8(b"walrus-blob-abc"),
            string::utf8(b"cross-DEX arbitrage gas"),
            scenario.ctx(),
        );
        assert!(underwriter::liquidity(&treasury) == 500_000, 1);
        assert!(underwriter::active_loans(&treasury) == 1, 2);
        assert!(underwriter::total_disbursed(&treasury) == 500_000, 3);
        assert!(underwriter::outstanding(&treasury) == 500_000, 17);
        assert!(reputation::trust_score(&registry, BORROWER) == 720, 4);
        assert!(reputation::loans_taken(&registry, BORROWER) == 1, 5);
        scenario.return_to_sender(cap);
        ts::return_shared(treasury);
        ts::return_shared(registry);
    };

    // tx4: borrower inspects the soulbound loan + the disbursed coin.
    scenario.next_tx(BORROWER);
    {
        let loan = scenario.take_from_sender<Loan>();
        assert!(loan::principal(&loan) == 500_000, 6);
        assert!(loan::borrower(&loan) == BORROWER, 7);
        assert!(loan::apy_bps(&loan) == 1800, 8);
        assert!(loan::is_active(&loan), 9);
        assert!(loan::decision_blob(&loan) == string::utf8(b"walrus-blob-abc"), 10);
        scenario.return_to_sender(loan);

        let disbursed = scenario.take_from_sender<Coin<MOCK_USDC>>();
        assert!(coin::value(&disbursed) == 500_000, 11);
        scenario.return_to_sender(disbursed);
    };

    // tx5: borrower repays principal + interest (0.505 mUSDC).
    scenario.next_tx(BORROWER);
    {
        let mut treasury = scenario.take_shared<Treasury<MOCK_USDC>>();
        let mut registry = scenario.take_shared<ReputationRegistry>();
        let mut loan = scenario.take_from_sender<Loan>();
        let payment = coin::mint_for_testing<MOCK_USDC>(505_000, scenario.ctx());
        underwriter::repay(&mut treasury, &mut registry, &mut loan, payment, scenario.ctx());
        assert!(loan::status(&loan) == STATUS_REPAID, 12);
        assert!(underwriter::active_loans(&treasury) == 0, 13);
        assert!(underwriter::total_repaid(&treasury) == 505_000, 14);
        assert!(underwriter::liquidity(&treasury) == 1_005_000, 15);
        assert!(underwriter::outstanding(&treasury) == 0, 18);
        assert!(reputation::loans_repaid(&registry, BORROWER) == 1, 16);
        scenario.return_to_sender(loan);
        ts::return_shared(treasury);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

// ─────────────── Helpers for the risk-limit tests ───────────────

#[test_only]
fun bootstrap(s: &mut Scenario, max_loan: u64, min_trust: u64, max_out: u64, seed: u64) {
    underwriter::init_for_testing(s.ctx());
    s.next_tx(ADMIN);
    let admin = s.take_from_sender<AdminCap>();
    underwriter::create_treasury<MOCK_USDC>(&admin, max_loan, min_trust, max_out, s.ctx());
    s.return_to_sender(admin);
    s.next_tx(ADMIN);
    let mut t = s.take_shared<Treasury<MOCK_USDC>>();
    transfer::public_transfer(underwriter::deposit(&mut t, coin::mint_for_testing<MOCK_USDC>(seed, s.ctx()), s.ctx()), ADMIN);
    ts::return_shared(t);
}

#[test_only]
fun do_disburse(s: &mut Scenario, principal: u64, trust: u64) {
    s.next_tx(ADMIN);
    let cap = s.take_from_sender<UnderwriterCap>();
    let mut t = s.take_shared<Treasury<MOCK_USDC>>();
    let mut r = s.take_shared<ReputationRegistry>();
    underwriter::disburse(
        &cap, &mut t, &mut r, BORROWER, principal, 1500, trust,
        string::utf8(b"b"), string::utf8(b"p"), s.ctx(),
    );
    s.return_to_sender(cap);
    ts::return_shared(t);
    ts::return_shared(r);
}

/// A single loan above the per-loan cap is rejected on-chain.
#[test, expected_failure(abort_code = underwriter::ELoanTooLarge)]
fun test_loan_too_large() {
    let mut s = ts::begin(ADMIN);
    bootstrap(&mut s, 100, 0, 1_000_000_000, 1_000_000);
    do_disburse(&mut s, 200, 720); // 200 > max_loan 100
    ts::end(s);
}

/// A borrower below the trust floor is rejected on-chain.
#[test, expected_failure(abort_code = underwriter::ETrustTooLow)]
fun test_trust_too_low() {
    let mut s = ts::begin(ADMIN);
    bootstrap(&mut s, 1_000_000, 500, 1_000_000_000, 1_000_000);
    do_disburse(&mut s, 100, 400); // trust 400 < min_trust 500
    ts::end(s);
}

/// Total outstanding debt cannot exceed the exposure cap.
#[test, expected_failure(abort_code = underwriter::EExposureCapReached)]
fun test_exposure_cap() {
    let mut s = ts::begin(ADMIN);
    bootstrap(&mut s, 1_000_000, 0, 150, 1_000_000);
    do_disburse(&mut s, 100, 720); // outstanding -> 100 (ok)
    do_disburse(&mut s, 100, 720); // 100 + 100 = 200 > cap 150 -> abort
    ts::end(s);
}

/// When paused, disbursement is blocked by the circuit breaker.
#[test, expected_failure(abort_code = underwriter::EPaused)]
fun test_paused_blocks_disburse() {
    let mut s = ts::begin(ADMIN);
    bootstrap(&mut s, 1_000_000, 0, 1_000_000_000, 1_000_000);
    s.next_tx(ADMIN);
    {
        let admin = s.take_from_sender<AdminCap>();
        let mut t = s.take_shared<Treasury<MOCK_USDC>>();
        underwriter::set_paused(&admin, &mut t, true);
        assert!(underwriter::is_paused(&t), 0);
        s.return_to_sender(admin);
        ts::return_shared(t);
    };
    do_disburse(&mut s, 100, 720); // paused -> abort
    ts::end(s);
}

/// Depositors earn yield: repaid loan interest lifts the LP share value, so a
/// depositor withdraws more than they put in.
#[test]
fun test_savings_yield() {
    let mut s = ts::begin(ADMIN);
    underwriter::init_for_testing(s.ctx());
    s.next_tx(ADMIN);
    {
        let admin = s.take_from_sender<AdminCap>();
        underwriter::create_treasury<MOCK_USDC>(&admin, 1_000_000, 0, 1_000_000_000, s.ctx());
        s.return_to_sender(admin);
    };

    // ADMIN deposits 1.0 mUSDC into the savings pool and receives LP shares at par.
    s.next_tx(ADMIN);
    {
        let mut t = s.take_shared<Treasury<MOCK_USDC>>();
        let pos = underwriter::deposit(&mut t, coin::mint_for_testing<MOCK_USDC>(1_000_000, s.ctx()), s.ctx());
        assert!(underwriter::position_shares(&pos) == 1_000_000, 0);
        assert!(underwriter::share_price_scaled(&t) == 1_000_000, 1); // par
        transfer::public_transfer(pos, ADMIN);
        ts::return_shared(t);
    };

    // Lend 0.5 to a borrower (asset-neutral: funds -> outstanding).
    do_disburse(&mut s, 500_000, 720);

    // Borrower repays 0.55 (0.5 principal + 0.05 interest). The 0.05 is yield.
    s.next_tx(BORROWER);
    {
        let mut t = s.take_shared<Treasury<MOCK_USDC>>();
        let mut r = s.take_shared<ReputationRegistry>();
        let mut loan = s.take_from_sender<Loan>();
        underwriter::repay(&mut t, &mut r, &mut loan, coin::mint_for_testing<MOCK_USDC>(550_000, s.ctx()), s.ctx());
        assert!(underwriter::share_price_scaled(&t) == 1_050_000, 2); // +5%
        s.return_to_sender(loan);
        ts::return_shared(t);
        ts::return_shared(r);
    };

    // ADMIN withdraws and receives 1.05 — the original 1.0 plus 0.05 of yield.
    s.next_tx(ADMIN);
    {
        let mut t = s.take_shared<Treasury<MOCK_USDC>>();
        let pos = s.take_from_sender<LpPosition<MOCK_USDC>>();
        let out = underwriter::withdraw(&mut t, pos, s.ctx());
        assert!(coin::value(&out) == 1_050_000, 3);
        transfer::public_transfer(out, ADMIN);
        ts::return_shared(t);
    };

    ts::end(s);
}

/// A repayment smaller than the principal is rejected.
#[test, expected_failure(abort_code = underwriter::EInsufficientRepayment)]
fun test_dust_repayment_rejected() {
    let mut s = ts::begin(ADMIN);
    bootstrap(&mut s, 1_000_000, 0, 1_000_000_000, 1_000_000);
    do_disburse(&mut s, 500_000, 720);
    s.next_tx(BORROWER);
    {
        let mut t = s.take_shared<Treasury<MOCK_USDC>>();
        let mut r = s.take_shared<ReputationRegistry>();
        let mut loan = s.take_from_sender<Loan>();
        let dust = coin::mint_for_testing<MOCK_USDC>(1, s.ctx()); // 1 << 500_000
        underwriter::repay(&mut t, &mut r, &mut loan, dust, s.ctx());
        s.return_to_sender(loan);
        ts::return_shared(t);
        ts::return_shared(r);
    };
    ts::end(s);
}

/// Disbursing more than the treasury holds must abort.
#[test, expected_failure(abort_code = underwriter::EInsufficientLiquidity)]
fun test_disburse_insufficient_liquidity() {
    let mut scenario = ts::begin(ADMIN);
    underwriter::init_for_testing(scenario.ctx());

    scenario.next_tx(ADMIN);
    {
        let admin = scenario.take_from_sender<AdminCap>();
        underwriter::create_treasury<MOCK_USDC>(&admin, 1_000_000, 0, 1_000_000_000, scenario.ctx());
        scenario.return_to_sender(admin);
    };

    // Treasury is empty — requesting 100 must abort with EInsufficientLiquidity.
    scenario.next_tx(ADMIN);
    {
        let cap = scenario.take_from_sender<UnderwriterCap>();
        let mut treasury = scenario.take_shared<Treasury<MOCK_USDC>>();
        let mut registry = scenario.take_shared<ReputationRegistry>();
        underwriter::disburse(
            &cap,
            &mut treasury,
            &mut registry,
            BORROWER,
            100,
            1800,
            720,
            string::utf8(b"blob"),
            string::utf8(b"purpose"),
            scenario.ctx(),
        );
        scenario.return_to_sender(cap);
        ts::return_shared(treasury);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}
