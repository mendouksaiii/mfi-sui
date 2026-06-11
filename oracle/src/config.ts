import * as dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const config = {
  network: (process.env.SUI_NETWORK || 'testnet') as 'testnet' | 'mainnet' | 'devnet',
  underwriterMnemonic: required('UNDERWRITER_MNEMONIC', ''),

  packageId: required('MFI_PACKAGE_ID', '0x0'),
  treasuryId: required('TREASURY_ID', '0x0'),
  registryId: required('REGISTRY_ID', '0x0'),
  underwriterCapId: required('UNDERWRITER_CAP_ID', '0x0'),
  coinType: required('COIN_TYPE', '0x0::mock_usdc::MOCK_USDC'),
  // Mock-USDC mint cap — used to credit agents their "job revenue" so they can
  // repay principal + interest (testnet only; mainnet agents earn real revenue).
  mockUsdcCap: process.env.MOCK_USDC_TREASURY_CAP || '',

  // Credit-report registry (separate package; see mfi-reports/).
  reportsPackageId: process.env.REPORTS_PACKAGE_ID || '',
  reportsRegistryId: process.env.REPORTS_REGISTRY_ID || '',
  bureauCapId: process.env.BUREAU_CAP_ID || '',

  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',

  walrusPublisher: process.env.WALRUS_PUBLISHER || 'https://publisher.walrus-testnet.walrus.space',
  walrusAggregator: process.env.WALRUS_AGGREGATOR || 'https://aggregator.walrus-testnet.walrus.space',
  walrusEpochs: parseInt(process.env.WALRUS_EPOCHS || '5', 10),

  port: parseInt(process.env.PORT || '3000', 10),

  // Seconds between agent cycles (base; ±50% jitter). Low = lively demo,
  // high = thrifty on gas. ~8s base ≈ 0.13 SUI/h; 60s ≈ 0.02 SUI/h.
  cycleWaitS: parseInt(process.env.CYCLE_WAIT_S || '8', 10),
};

/** USDC-style coins use 6 decimals; convert human <-> base units. */
export const DECIMALS = 6;
export const toBaseUnits = (human: number) => Math.round(human * 10 ** DECIMALS);
export const fromBaseUnits = (base: number | bigint) => Number(base) / 10 ** DECIMALS;
