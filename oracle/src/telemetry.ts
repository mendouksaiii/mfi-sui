import { client } from './sui.js';
import { config, fromBaseUnits } from './config.js';
import { withRetry } from './retry.js';

/** On-chain snapshot the risk model reasons over. Mirrors the EVM build's
 *  fetchAgentOnChainHistory, but uses Sui's object model. */
export interface AgentTelemetry {
  address: string;
  suiBalance: string;
  usdcBalance: string;
  ownedObjects: number;
  txCount: number;
  reputationLayer: 'High' | 'Medium' | 'New' | 'Unknown';
  error?: string;
}

export async function fetchAgentTelemetry(address: string): Promise<AgentTelemetry> {
  try {
    const [sui, coin, objects, txs] = await withRetry(
      () =>
        Promise.all([
          client.getBalance({ owner: address }),
          client.getBalance({ owner: address, coinType: config.coinType }).catch(() => null),
          client.getOwnedObjects({ owner: address, limit: 50 }),
          client
            .queryTransactionBlocks({ filter: { FromAddress: address }, limit: 50 })
            .catch(() => ({ data: [] as unknown[] })),
        ]),
      { label: 'telemetry' },
    );

    const txCount = txs.data.length;
    const ownedObjects = objects.data.length;
    const reputationLayer: AgentTelemetry['reputationLayer'] =
      txCount > 25 ? 'High' : txCount > 5 ? 'Medium' : 'New';

    return {
      address,
      suiBalance: (Number(sui.totalBalance) / 1e9).toFixed(6),
      usdcBalance: coin ? fromBaseUnits(BigInt(coin.totalBalance)).toFixed(6) : '0.0',
      ownedObjects,
      txCount,
      reputationLayer,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      address,
      suiBalance: '0',
      usdcBalance: '0.0',
      ownedObjects: 0,
      txCount: 0,
      reputationLayer: 'Unknown',
      error: msg,
    };
  }
}
