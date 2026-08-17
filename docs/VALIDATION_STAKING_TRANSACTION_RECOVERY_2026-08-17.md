# Staking transaction recovery validation — 2026-08-17

PowerChain staking transaction recovery is a client-side operational safety layer for wallet-submitted Solana staking instructions. It is not bridge settlement finality, reward accounting, or a custody service.

## Implemented

- Wallet-signed staking signatures are written to a bounded local journal after `sendTransaction` succeeds.
- Journal entries synchronize across tabs with `BroadcastChannel` and retain a maximum of 20 recent entries for seven days.
- The dashboard owns one journal controller, avoiding duplicate reconciliation loops between the transaction form and recovery panel.
- `GET /api/v1/staking/transactions/:signature` reconciles signatures with Solana `getSignatureStatuses` through the configured RPC pool.
- States are monotonic: `confirmed` cannot regress to `processed` because a fallback RPC is behind.
- A newly submitted signature is given a grace period before it may be shown as `not_found`; `not_found` remains non-terminal and continues to reconcile.
- `failed` and `finalized` are terminal local journal states.
- Reconciliation never signs, rebuilds, retries, or resubmits a staking instruction.
- The connected wallet remains the only signing authority for staking actions.

## Validation

- `scripts/staking-reconciliation-production-check.mjs`: PASS
- All direct `scripts/*production-check.mjs`: 64/64 PASS
- TypeScript parser gate: 560 TS/TSX files PASS
- Markdown structure: 83 files PASS
- Route contract: 86 API route files / 87 actions / 14 redirects PASS
- Postman: 87 actions / 4 flows / 10 mocks PASS
- Separated Bridge API: 11 paths PASS
- Separated Swap API: 7 paths PASS

A dependency-backed Next.js semantic build and live Solana RPC transaction exercise still belong in the real Node 24 / pnpm 11.22.0 deployment checkout before production promotion.
