/// Mock USDC for the M-Fi testnet demo.
///
/// HashKey/EVM versions of M-Fi used a Mock USDT ERC-20 because testnets lack
/// deep stablecoin liquidity. The same constraint applies on Sui testnet, so we
/// mint a controllable 6-decimal `MOCK_USDC` coin to prove the end-to-end
/// treasury -> disburse -> repay loop. On mainnet the `Treasury<T>` is generic,
/// so the operator simply parameterises it with native USDC instead.
module mfi::mock_usdc;

use sui::coin::{Self, TreasuryCap};

/// One-time witness. Must be the uppercased module name.
public struct MOCK_USDC has drop {}

#[allow(deprecated_usage)]
fun init(witness: MOCK_USDC, ctx: &mut TxContext) {
    let (treasury_cap, metadata) = coin::create_currency(
        witness,
        6, // USDC uses 6 decimals
        b"mUSDC",
        b"Mock USDC",
        b"Mock USDC for the M-Fi Underwriter testnet demo",
        option::none(),
        ctx,
    );
    // Metadata is immutable once published.
    transfer::public_freeze_object(metadata);
    // The publisher keeps the mint capability to seed demo liquidity.
    transfer::public_transfer(treasury_cap, ctx.sender());
}

/// Cap-gated mint used to seed the treasury / fund demo agents.
public fun mint(
    cap: &mut TreasuryCap<MOCK_USDC>,
    amount: u64,
    recipient: address,
    ctx: &mut TxContext,
) {
    let coin = coin::mint(cap, amount, ctx);
    transfer::public_transfer(coin, recipient);
}
