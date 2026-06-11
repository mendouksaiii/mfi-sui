/// Shared, on-chain reputation registry for borrowing agents.
///
/// Replaces the off-chain JSON "trust score" ledger of the EVM build with a
/// shared object the whole network can read. The underwriter updates an agent's
/// record on every disbursement and repayment; the frontend reads it directly
/// for the live leaderboard.
module mfi::reputation;

use sui::table::{Self, Table};
use sui::event;

/// One agent's credit history.
public struct Record has store, copy, drop {
    /// Latest trust score (0-1000) assigned by the underwriter.
    trust_score: u64,
    loans_taken: u64,
    loans_repaid: u64,
    /// Cumulative principal borrowed, in treasury base units.
    total_borrowed: u64,
}

public struct ReputationRegistry has key {
    id: UID,
    scores: Table<address, Record>,
}

public struct ReputationUpdated has copy, drop {
    agent: address,
    trust_score: u64,
    loans_taken: u64,
    loans_repaid: u64,
    total_borrowed: u64,
}

/// Build and share the registry. Called by `mfi::underwriter` during `init`.
/// Sharing must happen here because `ReputationRegistry` has `key` without
/// `store`, so `transfer::share_object` is restricted to this module.
public(package) fun create_and_share(ctx: &mut TxContext) {
    transfer::share_object(ReputationRegistry {
        id: object::new(ctx),
        scores: table::new(ctx),
    });
}

/// Record a new loan against an agent, refreshing its trust score.
public(package) fun record_loan(
    reg: &mut ReputationRegistry,
    agent: address,
    trust_score: u64,
    amount: u64,
) {
    if (!reg.scores.contains(agent)) {
        reg.scores.add(
            agent,
            Record { trust_score, loans_taken: 0, loans_repaid: 0, total_borrowed: 0 },
        );
    };
    let r = reg.scores.borrow_mut(agent);
    r.trust_score = trust_score;
    r.loans_taken = r.loans_taken + 1;
    r.total_borrowed = r.total_borrowed + amount;
    event::emit(ReputationUpdated {
        agent,
        trust_score: r.trust_score,
        loans_taken: r.loans_taken,
        loans_repaid: r.loans_repaid,
        total_borrowed: r.total_borrowed,
    });
}

/// Record a successful repayment for an agent.
public(package) fun record_repayment(reg: &mut ReputationRegistry, agent: address) {
    if (reg.scores.contains(agent)) {
        let r = reg.scores.borrow_mut(agent);
        r.loans_repaid = r.loans_repaid + 1;
        event::emit(ReputationUpdated {
            agent,
            trust_score: r.trust_score,
            loans_taken: r.loans_taken,
            loans_repaid: r.loans_repaid,
            total_borrowed: r.total_borrowed,
        });
    }
}

// ─────────────── Read-only accessors ───────────────

public fun has_record(reg: &ReputationRegistry, agent: address): bool {
    reg.scores.contains(agent)
}

public fun trust_score(reg: &ReputationRegistry, agent: address): u64 {
    if (reg.scores.contains(agent)) reg.scores.borrow(agent).trust_score else 0
}

public fun loans_taken(reg: &ReputationRegistry, agent: address): u64 {
    if (reg.scores.contains(agent)) reg.scores.borrow(agent).loans_taken else 0
}

public fun loans_repaid(reg: &ReputationRegistry, agent: address): u64 {
    if (reg.scores.contains(agent)) reg.scores.borrow(agent).loans_repaid else 0
}
