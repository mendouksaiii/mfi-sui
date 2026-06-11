'use client';

import { ConnectButton } from '@mysten/dapp-kit';

/** dapp-kit ConnectButton, restyled to the M-Fi system via a wrapper. */
export function WalletButton() {
  return (
    <div className="mfi-connect">
      <ConnectButton connectText="Connect Wallet" />
      <style jsx global>{`
        .mfi-connect button {
          background: #15181c !important;
          color: #e8eaed !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 0.625rem !important;
          font-family: var(--font-geist-mono), monospace !important;
          font-size: 13px !important;
          padding: 0.5rem 1rem !important;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .mfi-connect button:hover {
          border-color: rgba(52, 211, 196, 0.5) !important;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}
