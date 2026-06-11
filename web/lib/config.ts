// Live testnet deployment — hardened contract (published 2026-06-09).
export const MFI = {
  network: 'testnet' as const,
  packageId: '0x8b75ef9aa4c20c03207e2b3821038240f8e17d48e3b0cc6b58c43c6bde818036',
  treasuryId: '0x1a52d0fd2da9078ebeb2b12c562cdb50964ddd9c3332b1424ec7378f46986983',
  registryId: '0xc870232497611777ba48d29842f320eba3555caec4b9754100f9d9daf83e20a8',
  coinType: '0x8b75ef9aa4c20c03207e2b3821038240f8e17d48e3b0cc6b58c43c6bde818036::mock_usdc::MOCK_USDC',
  explorer: 'https://testnet.suivision.xyz',
  walrusAggregator: 'https://aggregator.walrus-testnet.walrus.space',
  // The underwriter's address — decisions on Walrus are Ed25519-signed by this
  // key (the same key that holds the UnderwriterCap), verified in-browser.
  underwriter: '0x1fe357c2b5d436115aa79620785c6fcdc07492685588cdaacab70b2902aaf581',
  // Credit-report registry (mfi_reports package): agent → latest report blob.
  reportsPackageId: '0x8bbb42ddd316638e363e998ec7db8f6dbdffebc1cdc08f9707d6e2377a991045',
  reportsRegistryId: '0x053f4aad29b6af9609b9add5a4d64da032cc668d0214a56150a1291151ce2170',
};

export const DECIMALS = 6;

export const fmtUsdc = (base: number | string) =>
  (Number(base) / 10 ** DECIMALS).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const shortAddr = (a: string, lead = 6, tail = 4) =>
  a.length > lead + tail ? `${a.slice(0, lead)}…${a.slice(-tail)}` : a;
