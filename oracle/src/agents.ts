/**
 * M-Fi Autonomous Agent Loop.
 *
 * Spins up a set of real Sui agents that perpetually:
 *   1. report their on-chain telemetry to the underwriter
 *   2. get underwritten (LLM via Groq, or a rule-based fallback with no key)
 *   3. receive a USDC disbursement on-chain (LoanDisbursed)
 *   4. "work" for a few seconds
 *   5. repay the loan from their own wallet (LoanRepaid)
 *   6. loop — their reputation climbs with every clean cycle
 *
 * Every cycle is a real testnet transaction, so the live dashboard moves on
 * its own. No human in the loop.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { client, underwriter, underwriterAddress } from './sui.js';
import { config, toBaseUnits, fromBaseUnits } from './config.js';
import { fetchAgentTelemetry, type AgentTelemetry } from './telemetry.js';
import { evaluateLoanRisk, type RiskDecision } from './risk-engine.js';
import { storeDecision } from './walrus.js';
import { publishReport } from './reports.js';
import { withRetry } from './retry.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KEYS_FILE = join(HERE, '..', '.agents.json');

// ─────────────── Agent personas ───────────────
// `defaults: true` marks an agent that takes its loan and never repays — it
// exists to demonstrate the consequence side of the credit system: its loan
// stays ACTIVE, its repayment ratio collapses, and the underwriter's on-chain
// credit check denies it all future credit.
const PERSONAS = [
  { handle: 'agent-77-scraping', job: 'Web3 Data Scraping', amount: 5, purpose: 'Gas for a revenue-positive scraping job.', defaults: false },
  { handle: 'agent-42-arbitrage', job: 'Cross-DEX Arbitrage', amount: 25, purpose: 'Capital for a 3.2% Cetus/Turbos spread.', defaults: false },
  { handle: 'agent-91-oracle', job: 'Oracle Price Feed', amount: 10, purpose: 'Gas for 24h of critical price-feed updates.', defaults: false },
  { handle: 'agent-15-yield', job: 'Scallop Yield Rebalance', amount: 50, purpose: 'Rebalance into a higher-APY Scallop pool.', defaults: false },
  { handle: 'agent-66-rogue', job: 'Leveraged MEV Bot', amount: 8, purpose: 'Capital for an aggressive MEV strategy.', defaults: true },
];

const GAS_TOPUP = 60_000_000n; // 0.06 SUI
const GAS_FLOOR = 30_000_000n; // top up below 0.03 SUI

interface Agent {
  handle: string;
  job: string;
  amount: number;
  purpose: string;
  defaults: boolean;
  keypair: Ed25519Keypair;
  address: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const log = (...a: unknown[]) => console.log(...a);

// ─────────────── Keypair persistence ───────────────
function loadAgents(): Agent[] {
  let secrets: string[] = existsSync(KEYS_FILE)
    ? (JSON.parse(readFileSync(KEYS_FILE, 'utf8')) as string[])
    : [];
  if (secrets.length < PERSONAS.length) {
    secrets = PERSONAS.map((_, i) => secrets[i] ?? Ed25519Keypair.generate().getSecretKey());
    writeFileSync(KEYS_FILE, JSON.stringify(secrets, null, 2));
    log(`🔑 Generated/loaded ${secrets.length} agent keypairs -> .agents.json`);
  }
  return PERSONAS.map((p, i) => {
    const keypair = Ed25519Keypair.fromSecretKey(secrets[i]);
    return { ...p, keypair, address: keypair.getPublicKey().toSuiAddress() };
  });
}

// ─────────────── Gas funding ───────────────
async function ensureFunded(agents: Agent[]) {
  const needy: Agent[] = [];
  for (const a of agents) {
    const bal = BigInt(
      (await withRetry(() => client.getBalance({ owner: a.address }), { label: 'gas balance' })).totalBalance,
    );
    if (bal < GAS_FLOOR) needy.push(a);
  }
  if (needy.length === 0) return;
  log(`⛽ Funding ${needy.length} agent(s) with gas...`);
  const tx = new Transaction();
  const coins = tx.splitCoins(tx.gas, needy.map(() => tx.pure.u64(GAS_TOPUP)));
  needy.forEach((a, i) => tx.transferObjects([coins[i]], tx.pure.address(a.address)));
  const r = await client.signAndExecuteTransaction({ signer: underwriter, transaction: tx, options: { showEffects: true } });
  await client.waitForTransaction({ digest: r.digest });
  log(`   funded (${r.digest.slice(0, 10)})`);
}

// ─────────────── Rule-based risk (no Groq key) ───────────────
function ruleBasedRisk(t: AgentTelemetry, requested: number): RiskDecision {
  if (t.error) return { decision: 'DENY', reasoning: 'Telemetry unreachable.', confidence: 1, trustScore: 0 };
  const jitter = Math.floor(Math.random() * 40);
  if (t.reputationLayer === 'High')
    return { decision: 'APPROVE', reasoning: `High-reputation agent (${t.txCount} txs). Approved in full.`, confidence: 0.9, trustScore: 900 + jitter };
  if (t.reputationLayer === 'Medium')
    return { decision: 'APPROVE', reasoning: `Established agent (${t.txCount} txs). Approved at a measured APY.`, confidence: 0.82, trustScore: 600 + jitter };
  // New agents: approve a reduced amount at a higher APY (a counter-offer the agent auto-accepts).
  return {
    decision: 'COUNTER_OFFER',
    reasoning: `New agent (${t.txCount} txs). Counter-offered a smaller line to build reputation.`,
    confidence: 0.7,
    trustScore: 380 + jitter,
    proposedAmount: Math.max(2, Math.round(requested * 0.5)),
    proposedApy: 20,
  };
}

const apyFor = (trust: number) => (trust >= 900 ? 1000 : trust >= 600 ? 1500 : 2000);

// ─────────────── Cure pass ───────────────
/** An honest agent settles any stranded ACTIVE loans (e.g. the loop was
 *  interrupted between disburse and repay) before asking for new credit.
 *  The rogue never cures — that's the point of it. */
/** All Loan objects an agent owns with status ACTIVE — ground truth for its
 *  outstanding book. Loans are soulbound, so an agent accumulates every Loan
 *  it ever took; walk all pages. */
async function listActiveLoans(address: string) {
  const all: any[] = [];
  let cursor: string | null | undefined = undefined;
  do {
    const page = await withRetry(
      () =>
        client.getOwnedObjects({
          owner: address,
          filter: { StructType: `${config.packageId}::loan::Loan` },
          options: { showContent: true },
          limit: 50,
          cursor,
        }),
      { label: 'list loans' },
    );
    all.push(...page.data);
    cursor = page.hasNextPage ? page.nextCursor : null;
  } while (cursor);
  return all.filter((o) => {
    const f = (o.data?.content as any)?.fields;
    return f && Number(f.status) === 0;
  });
}

async function cureDelinquencies(a: Agent) {
  const active = await listActiveLoans(a.address);
  for (const o of active) {
    const f = (o.data!.content as any).fields;
    const principalHuman = Math.ceil(Number(f.principal) / 10 ** 6);
    log(`  ♻ curing stranded loan ${o.data!.objectId.slice(0, 10)}… (${principalHuman} USDC)`);
    await creditRevenue(a.address, principalHuman + 1);
    await repay(a, o.data!.objectId);
  }
}

// ─────────────── On-chain credit check ───────────────
/** Count the borrower's ACTIVE Loan objects on-chain. Any unpaid loan is a
 *  hard protocol rule: no new credit until the book is clean. This runs
 *  BEFORE the model — credit consequences are deterministic, not a matter of
 *  LLM mood. (Ground truth from owned objects, not an event window: a
 *  delinquency must never age out of view as new events accumulate.) */
async function creditCheck(agent: Agent): Promise<{ unpaid: number }> {
  const active = await listActiveLoans(agent.address);
  return { unpaid: active.length };
}

// ─────────────── One agent lifecycle ───────────────
async function runCycle(a: Agent, peer: Agent | undefined, cycle: number) {
  log(`\n${'─'.repeat(56)}`);
  log(`◆ cycle #${cycle} · ${a.handle} · ${a.address.slice(0, 10)}…`);

  // 0a. honest agents settle any stranded loans before asking for credit.
  if (!a.defaults) {
    try {
      await cureDelinquencies(a);
    } catch (err) {
      log(`  ⚠ cure pass failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 0b. hard credit check against the on-chain registry — a delinquent book
  //     means denial before the model is even consulted.
  const credit = await creditCheck(a);
  if (credit.unpaid >= 1) {
    const denial: RiskDecision = {
      decision: 'DENY',
      reasoning: `On-chain ledger shows ${credit.unpaid} unpaid loan(s) still ACTIVE. No new credit until the book is clean.`,
      confidence: 1,
      trustScore: Math.max(0, 200 - credit.unpaid * 50),
    };
    try {
      const blob = await storeDecision({
        version: '1.0',
        timestamp: new Date().toISOString(),
        agentAddress: a.address,
        requestedAmount: a.amount,
        purpose: a.purpose,
        telemetry: await fetchAgentTelemetry(a.address),
        decision: denial,
        model: 'registry-rule-v1',
      });
      log(`  ✗ DENIED (on-chain history) — ${denial.reasoning}`);
      log(`  walrus: denial sealed ${blob.slice(0, 16)}…`);
    } catch {
      log(`  ✗ DENIED (on-chain history) — ${denial.reasoning}`);
    }
    return;
  }

  // 1. telemetry + underwrite
  const telemetry = await fetchAgentTelemetry(a.address);
  log(`  telemetry: ${telemetry.reputationLayer} · ${telemetry.txCount} txs · ${telemetry.usdcBalance} USDC`);
  // The rogue follows the deterministic new-agent policy (counter-offer a
  // starter line) so the default→denial arc is reproducible in every demo.
  const decision = config.groqApiKey && !a.defaults
    ? await evaluateLoanRisk(telemetry, a.amount, 'Reputation stake', a.purpose)
    : ruleBasedRisk(telemetry, a.amount);

  if (decision.decision === 'DENY') {
    log(`  ✗ DENIED — ${decision.reasoning}`);
    return;
  }
  const principal = decision.decision === 'COUNTER_OFFER' && decision.proposedAmount ? decision.proposedAmount : a.amount;
  const apyBps = decision.decision === 'COUNTER_OFFER' && decision.proposedApy ? decision.proposedApy * 100 : apyFor(decision.trustScore);
  log(`  ${decision.decision} — ${principal} USDC @ ${apyBps / 100}% · trust ${decision.trustScore}`);

  // 2. seal decision to Walrus (best-effort)
  let blob = `inline-${Date.now().toString(36)}`;
  try {
    blob = await storeDecision({
      version: '1.0',
      timestamp: new Date().toISOString(),
      agentAddress: a.address,
      requestedAmount: a.amount,
      purpose: a.purpose,
      telemetry,
      decision,
      model: config.groqApiKey ? config.groqModel : 'rule-based-v1',
    });
    log(`  walrus: ${blob.slice(0, 16)}…`);
  } catch {
    log(`  walrus: unavailable, inline blob id`);
  }

  // 3. disburse on-chain (underwriter signs)
  const disb = await disburseTo(a.address, principal, apyBps, decision.trustScore, blob, a.purpose);
  if (!disb.success || !disb.loanId) {
    log(`  ✗ disburse failed: ${disb.error}`);
    return;
  }
  log(`  ⤷ disbursed (${disb.digest.slice(0, 10)}) loan ${disb.loanId.slice(0, 10)}…`);

  // 4. work and earn revenue, then 5. repay principal + interest. The interest
  //    is net-new value to the pool — it is exactly the depositors' yield.
  await sleep(4000 + Math.random() * 4000);

  // The rogue takes the money and walks. Its loan stays ACTIVE on-chain, its
  // registry record shows the unpaid loan, and step 0 denies it from now on.
  if (a.defaults) {
    log(`  ☠ ${a.handle} DEFAULTED — loan left unpaid. The registry will remember.`);
    return;
  }

  const interest = Math.max(1, Math.round(principal * 0.1)); // ~10% job revenue
  await creditRevenue(a.address, interest + PEER_FEE);

  // 4b. pay a peer agent for a service (a real agent-to-agent transfer on-chain).
  if (peer && peer.address !== a.address) await payPeer(a, peer);

  // 5. repay principal + interest from what remains.
  await repay(a, disb.loanId);
}

/// A real agent→agent USDC transfer. Each working agent pays a small fee to a
/// peer (as if buying compute/data from it), so the explorer shows the agents
/// transacting among themselves, not just with the underwriter.
const PEER_FEE = 1; // USDC
async function payPeer(from: Agent, to: Agent) {
  const coins = await client.getCoins({ owner: from.address, coinType: config.coinType });
  if (coins.data.length === 0) return;
  const tx = new Transaction();
  const [first, ...rest] = coins.data.map((c) => tx.object(c.coinObjectId));
  if (rest.length) tx.mergeCoins(first, rest);
  const [fee] = tx.splitCoins(first, [tx.pure.u64(toBaseUnits(PEER_FEE))]);
  tx.transferObjects([fee], tx.pure.address(to.address));
  const r = await client.signAndExecuteTransaction({ signer: from.keypair, transaction: tx, options: { showEffects: true } });
  await client.waitForTransaction({ digest: r.digest });
  if (r.effects?.status.status === 'success')
    log(`  ⇄ paid peer ${to.handle} ${PEER_FEE} USDC (${r.digest.slice(0, 10)})`);
  else log(`  ⚠ peer pay failed: ${r.effects?.status.error}`);
}

/// Credit an agent its job revenue (testnet: minted; mainnet: real earnings),
/// so it can repay more than principal. Signed by the underwriter (cap holder).
async function creditRevenue(agentAddr: string, humanAmount: number) {
  if (!config.mockUsdcCap) return;
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::mock_usdc::mint`,
    arguments: [
      tx.object(config.mockUsdcCap),
      tx.pure.u64(toBaseUnits(humanAmount)),
      tx.pure.address(agentAddr),
    ],
  });
  const r = await client.signAndExecuteTransaction({ signer: underwriter, transaction: tx, options: { showEffects: true } });
  await client.waitForTransaction({ digest: r.digest });
  log(`  + revenue ${humanAmount} USDC credited (becomes pool yield)`);
}

async function disburseTo(borrower: string, principal: number, apyBps: number, trustScore: number, decisionBlob: string, purpose: string) {
  const tx = new Transaction();
  tx.moveCall({
    target: `${config.packageId}::underwriter::disburse`,
    typeArguments: [config.coinType],
    arguments: [
      tx.object(config.underwriterCapId),
      tx.object(config.treasuryId),
      tx.object(config.registryId),
      tx.pure.address(borrower),
      tx.pure.u64(toBaseUnits(principal)),
      tx.pure.u64(apyBps),
      tx.pure.u64(trustScore),
      tx.pure.string(decisionBlob),
      tx.pure.string(purpose),
    ],
  });
  const r = await client.signAndExecuteTransaction({ signer: underwriter, transaction: tx, options: { showEffects: true, showObjectChanges: true } });
  await client.waitForTransaction({ digest: r.digest });
  if (r.effects?.status.status !== 'success') return { success: false, digest: r.digest, error: r.effects?.status.error };
  const loan = r.objectChanges?.find((c) => c.type === 'created' && c.objectType.endsWith('::loan::Loan')) as { objectId: string } | undefined;
  return { success: true, digest: r.digest, loanId: loan?.objectId };
}

async function repay(a: Agent, loanId: string) {
  const coins = await client.getCoins({ owner: a.address, coinType: config.coinType });
  if (coins.data.length === 0) {
    log(`  ⚠ no USDC to repay with (skipping repay)`);
    return;
  }
  const tx = new Transaction();
  // If the agent holds several coins, merge into the first to pay in one object.
  const [pay, ...rest] = coins.data.map((c) => tx.object(c.coinObjectId));
  if (rest.length) tx.mergeCoins(pay, rest);
  tx.moveCall({
    target: `${config.packageId}::underwriter::repay`,
    typeArguments: [config.coinType],
    arguments: [tx.object(config.treasuryId), tx.object(config.registryId), tx.object(loanId), pay],
  });
  const r = await client.signAndExecuteTransaction({ signer: a.keypair, transaction: tx, options: { showEffects: true } });
  await client.waitForTransaction({ digest: r.digest });
  if (r.effects?.status.status === 'success') log(`  ✓ repaid (${r.digest.slice(0, 10)})`);
  else log(`  ⚠ repay failed: ${r.effects?.status.error}`);
}

// ─────────────── Main loop ───────────────
async function main() {
  log('\n╔══════════════════════════════════════════════════════╗');
  log('║   M-Fi AUTONOMOUS AGENTS — perpetual on-chain loop   ║');
  log(`║   underwriter ${underwriterAddress.slice(0, 14)}…            ║`);
  log(`║   risk engine: ${config.groqApiKey ? 'Groq LLaMA 3.1' : 'rule-based (no GROQ key)'}`.padEnd(55) + '║');
  log('╚══════════════════════════════════════════════════════╝');

  const agents = loadAgents();
  agents.forEach((a) => log(`  • ${a.handle} → ${a.address}`));
  await ensureFunded(agents);

  let cycle = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    cycle++;
    const a = agents[cycle % agents.length];
    // Pick the next non-defaulting agent as the service peer — honest agents
    // don't buy compute from a deadbeat.
    let peer = agents[(cycle + 1) % agents.length];
    if (peer.defaults) peer = agents[(cycle + 2) % agents.length];
    try {
      await runCycle(a, peer, cycle);
    } catch (err) {
      log(`  🔥 cycle error: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (cycle % agents.length === 0) {
      await ensureFunded(agents);
      // Each round, refresh one agent's credit report: compile history from
      // chain, sign + seal on Walrus, publish blob ID to the ReportRegistry.
      const subject = agents[(cycle / agents.length) % agents.length];
      try {
        const pub = await publishReport(subject);
        if (pub) log(`  📄 credit report for ${subject.handle}: blob ${pub.blobId.slice(0, 12)}… (${pub.digest.slice(0, 10)})`);
      } catch (err) {
        log(`  ⚠ report publish failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    const base = config.cycleWaitS;
    const wait = Math.max(4, Math.round(base * (0.75 + Math.random() * 0.5)));
    log(`  … next agent in ${wait}s`);
    await sleep(wait * 1000);
  }
}

main().catch((e) => {
  console.error('🔥 fatal:', e);
  process.exit(1);
});
