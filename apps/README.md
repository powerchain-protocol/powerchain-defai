# Applications

PowerChain DeFAI application workspaces live under `apps/`. Shared protocol/runtime code belongs in `packages/`, `clusters/`, or `shared/blockchain/`; application orchestration stays with its owning workspace.

| Workspace | Responsibility |
| --- | --- |
| `bridge/` | Compatibility Next.js DeFAI shell, UI routes, and `/api/v1` adapters |
| `backend/` | Canonical server-only business/domain services exposed as `@powerchain/backend` |
| `chat/` | DeFAI assistant prompts, messages, charts, suggestions, and saved prompts |
| `staking/` | Verified deployment/reward boundary for fixed-pool PWRC/wPWRC staking |
| `worker-bridge/` | Wormhole NTT finality, correlation, and reconciliation supervisor |
| `worker-claims/` | Claim payout/finality/recovery supervisor |
| `worker-fees/` | Service-fee verification supervisor |

`apps/bridge` retains its historical name for compatibility, but it is the full PowerChain DeFAI web shell rather than a bridge-only application.

Workers should remain thin process entrypoints over canonical services in `apps/backend`. Do not duplicate claims, fees, transaction, RPC, DEX, or Bridge business logic into worker apps.

Staking is asynchronous and fail-closed: configured identifiers become executable only after runtime verification. See [`../docs/STAKING.md`](../docs/STAKING.md).

Use root commands for installation, validation, and production builds. See [`../README.md`](../README.md), [`backend/README.md`](backend/README.md), and [`../docs/README.md`](../docs/README.md).
