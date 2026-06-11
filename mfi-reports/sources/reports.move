/// On-chain registry of agent credit reports.
///
/// The M-Fi credit bureau's product is the credit report: a signed JSON
/// document on Walrus aggregating an agent's full borrowing history, trust
/// trajectory, and the blob IDs of every underwriting decision as evidence.
/// This module is the discovery layer — it maps an agent address to its
/// latest report blob ID, so any protocol (not just the M-Fi frontend) can
/// resolve an agent's portable, verifiable credit history.
module mfi_reports::reports;

use std::string::String;
use sui::event;
use sui::table::{Self, Table};

/// One agent's latest published report.
public struct Entry has store, copy, drop {
    /// Walrus blob ID of the latest credit report (content-addressed).
    blob_id: String,
    /// Monotonic report number for this agent (1-based).
    sequence: u64,
    /// Epoch-ms timestamp the bureau attached at publish time.
    published_ms: u64,
}

/// Shared registry: agent address → latest credit report.
public struct ReportRegistry has key {
    id: UID,
    latest: Table<address, Entry>,
}

/// Capability to publish reports — held by the bureau (the underwriter key).
public struct BureauCap has key, store { id: UID }

public struct ReportPublished has copy, drop {
    agent: address,
    blob_id: String,
    sequence: u64,
    published_ms: u64,
}

fun init(ctx: &mut TxContext) {
    transfer::share_object(ReportRegistry { id: object::new(ctx), latest: table::new(ctx) });
    transfer::public_transfer(BureauCap { id: object::new(ctx) }, ctx.sender());
}

/// Publish (or supersede) an agent's credit report. Bureau-gated.
public fun publish(
    _: &BureauCap,
    registry: &mut ReportRegistry,
    agent: address,
    blob_id: String,
    published_ms: u64,
) {
    let sequence = if (registry.latest.contains(agent)) {
        let prev = registry.latest.remove(agent);
        prev.sequence + 1
    } else {
        1
    };
    registry.latest.add(agent, Entry { blob_id, sequence, published_ms });
    event::emit(ReportPublished { agent, blob_id, sequence, published_ms });
}

/// Resolve an agent's latest report (blob ID, sequence, published-at).
public fun latest(registry: &ReportRegistry, agent: address): (String, u64, u64) {
    let entry = registry.latest.borrow(agent);
    (entry.blob_id, entry.sequence, entry.published_ms)
}

public fun has_report(registry: &ReportRegistry, agent: address): bool {
    registry.latest.contains(agent)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) { init(ctx) }

#[test]
fun test_publish_and_supersede() {
    let mut ctx = tx_context::dummy();
    let mut registry = ReportRegistry { id: object::new(&mut ctx), latest: table::new(&mut ctx) };
    let cap = BureauCap { id: object::new(&mut ctx) };
    let agent = @0xA11CE;

    publish(&cap, &mut registry, agent, b"blob-one".to_string(), 1000);
    let (blob, seq, ms) = latest(&registry, agent);
    assert!(blob == b"blob-one".to_string() && seq == 1 && ms == 1000);

    publish(&cap, &mut registry, agent, b"blob-two".to_string(), 2000);
    let (blob2, seq2, _) = latest(&registry, agent);
    assert!(blob2 == b"blob-two".to_string() && seq2 == 2);
    assert!(has_report(&registry, agent));
    assert!(!has_report(&registry, @0xB0B));

    let BureauCap { id } = cap;
    id.delete();
    transfer::share_object(registry);
}
