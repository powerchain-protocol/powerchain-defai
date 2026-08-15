# Applications

- `bridge/` — Next.js 16 production web/API application; build output is `apps/bridge/.next`.
- `backend/` — server-only PowerChain business/domain services consumed as `@powerchain/backend`.
- `worker-claims/` — claim payout/recovery worker.
- `worker-fees/` — service-fee verification worker.

The canonical workspace is managed from the repository root with pnpm 11.21.0.

- `worker-bridge/` — verifies real Wormhole NTT source finality, VAA/operation correlation, destination finality and completion reconciliation.
