'use client';

import { useCallback, useEffect, useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from '@mysten/dapp-kit';
import { ArrowDown, ArrowUp, CircleNotch } from '@phosphor-icons/react';
import { MFI, DECIMALS, fmtUsdc } from '@/lib/config';
import { WalletButton } from './WalletButton';

const LP_TYPE = `${MFI.packageId}::underwriter::LpPosition<${MFI.coinType}>`;
const toBase = (human: number) => Math.round(human * 10 ** DECIMALS);

interface Position {
  id: string;
  shares: number;
}

type Status = { kind: 'idle' | 'busy' | 'ok' | 'err'; msg?: string };

/** Live deposit / withdraw against the on-chain savings vault. Signs with the
 *  connected wallet via dapp-kit. Deposit takes MOCK_USDC, mints an LpPosition;
 *  withdraw redeems a position back to USDC (plus accrued yield). */
export function DepositWidget() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [amount, setAmount] = useState('25');
  const [usdc, setUsdc] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const refresh = useCallback(async () => {
    if (!account) {
      setUsdc(null);
      setPositions([]);
      return;
    }
    const [bal, owned] = await Promise.all([
      client.getBalance({ owner: account.address, coinType: MFI.coinType }),
      client.getOwnedObjects({
        owner: account.address,
        filter: { StructType: LP_TYPE },
        options: { showContent: true },
      }),
    ]);
    setUsdc(Number(bal.totalBalance));
    setPositions(
      owned.data
        .map((o) => {
          const f = (o.data?.content as any)?.fields;
          return f ? { id: o.data!.objectId, shares: Number(f.shares) } : null;
        })
        .filter(Boolean) as Position[],
    );
  }, [account, client]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function deposit() {
    if (!account) return;
    const base = toBase(Number(amount));
    if (!base || base <= 0) return setStatus({ kind: 'err', msg: 'Enter an amount.' });
    if (usdc !== null && base > usdc)
      return setStatus({ kind: 'err', msg: 'Amount exceeds your test-USDC balance.' });

    setStatus({ kind: 'busy', msg: 'Depositing…' });
    try {
      const coins = await client.getCoins({ owner: account.address, coinType: MFI.coinType });
      if (coins.data.length === 0) throw new Error('No test USDC in this wallet.');

      const tx = new Transaction();
      const [first, ...rest] = coins.data.map((c) => tx.object(c.coinObjectId));
      if (rest.length) tx.mergeCoins(first, rest);
      const [pay] = tx.splitCoins(first, [tx.pure.u64(base)]);
      const [position] = tx.moveCall({
        target: `${MFI.packageId}::underwriter::deposit`,
        typeArguments: [MFI.coinType],
        arguments: [tx.object(MFI.treasuryId), pay],
      });
      tx.transferObjects([position], tx.pure.address(account.address));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dedupe: nested @mysten/sui copy
      const r = await signAndExecute({ transaction: tx as any });
      await client.waitForTransaction({ digest: r.digest });
      setStatus({ kind: 'ok', msg: `Deposited ${amount} USDC · received LP shares.` });
      refresh();
    } catch (e) {
      setStatus({ kind: 'err', msg: friendly(e) });
    }
  }

  async function withdraw(p: Position) {
    if (!account) return;
    setStatus({ kind: 'busy', msg: 'Withdrawing…' });
    try {
      const tx = new Transaction();
      const [coin] = tx.moveCall({
        target: `${MFI.packageId}::underwriter::withdraw`,
        typeArguments: [MFI.coinType],
        arguments: [tx.object(MFI.treasuryId), tx.object(p.id)],
      });
      tx.transferObjects([coin], tx.pure.address(account.address));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dedupe: nested @mysten/sui copy
      const r = await signAndExecute({ transaction: tx as any });
      await client.waitForTransaction({ digest: r.digest });
      setStatus({ kind: 'ok', msg: 'Withdrawn to your wallet, plus accrued yield.' });
      refresh();
    } catch (e) {
      setStatus({ kind: 'err', msg: friendly(e) });
    }
  }

  if (!account) {
    return (
      <div className="rounded-xl border border-line-strong bg-ink-950 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-fg-faint">Try it on testnet</p>
        <p className="mt-2 max-w-[42ch] text-sm text-fg-muted">
          Connect a Sui testnet wallet to deposit into the live vault and receive LP shares. (You&apos;ll
          need a little test USDC — ask the team to top you up.)
        </p>
        <div className="mt-4">
          <WalletButton />
        </div>
      </div>
    );
  }

  const busy = status.kind === 'busy';

  return (
    <div className="rounded-xl border border-line-strong bg-ink-950 p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-fg-faint">Live vault · testnet</p>
        <p className="font-mono text-[11px] text-fg-faint">
          balance: <span className="text-fg">{usdc === null ? '—' : `$${fmtUsdc(usdc)}`}</span> USDC
        </p>
      </div>

      {/* deposit */}
      <div className="mt-4 flex items-stretch gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-line bg-ink-900 px-3">
          <span className="font-mono text-sm text-fg-faint">$</span>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
            className="w-full bg-transparent px-2 py-2.5 font-mono text-sm text-fg outline-none"
            aria-label="Deposit amount in USDC"
          />
        </div>
        <button
          onClick={deposit}
          disabled={busy}
          className="btn-cyan inline-flex items-center gap-2 px-5 font-display text-xs font-bold uppercase tracking-[0.18em] disabled:opacity-60"
        >
          {busy ? <CircleNotch size={14} className="animate-spin" /> : <ArrowDown size={14} weight="bold" />}
          Deposit
        </button>
      </div>

      {/* positions */}
      {positions.length > 0 && (
        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-fg-faint">Your LP positions</p>
          <ul className="mt-2 divide-y divide-line overflow-hidden rounded-lg border border-line">
            {positions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 bg-ink-900/40 px-4 py-2.5">
                <span className="font-mono text-[12px] text-fg-muted">
                  {p.shares.toLocaleString()} shares
                  <span className="ml-2 text-fg-faint">{p.id.slice(0, 8)}…</span>
                </span>
                <button
                  onClick={() => withdraw(p)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md border border-signal/35 bg-signal/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-signal transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-signal/20 active:scale-95 disabled:opacity-60"
                >
                  <ArrowUp size={12} weight="bold" /> Withdraw
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* status line */}
      {status.msg && (
        <p
          className={`mt-4 font-mono text-xs ${
            status.kind === 'err' ? 'text-denied' : status.kind === 'ok' ? 'text-repaid' : 'text-fg-muted'
          }`}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}

function friendly(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (/Rejected|rejected|denied/.test(m)) return 'Transaction rejected in wallet.';
  if (/EInsufficientLiquidity|liquidity/i.test(m)) return 'Vault is short on liquid funds right now — capital is out on loan. Try a smaller amount.';
  if (/No test USDC/.test(m)) return 'No test USDC in this wallet.';
  if (/Insufficient|gas/i.test(m)) return 'Not enough SUI for gas, or insufficient balance.';
  return m.length > 120 ? m.slice(0, 120) + '…' : m;
}
