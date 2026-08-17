# Packages

Reusable first-party packages under `packages/` must not depend on application UI code.

| Package | Responsibility |
| --- | --- |
| `@powerchain/database` | Prisma/PostgreSQL client and persistence boundary |
| `@powerchain/protocol` | canonical protocol assets, addresses, validation, fees, ecosystem registry, and information commitment |
| `@powerchain/runtime` | shared supervised-worker/runtime primitives |
| `@powerchain/sdk` | typed public client, including separated Bridge and Swap clients |

Application feature packages such as `@powerchain/staking` and `@powerchain/chat` live under `apps/` because they own product/runtime orchestration rather than generic protocol primitives.

Additional first-party workspace foundations live outside `packages/`:

| Workspace | Responsibility |
| --- | --- |
| `@powerchain/clusters` (`clusters/`) | canonical Solana/Sui cluster definitions |
| `@powerchain/blockchain` (`shared/blockchain/`) | shared chain, address, coin-type, and cross-chain route primitives |
| `@powerchain/api-contracts` (`api/`) | combined release API contract/tooling package |
| `@powerchain/bridge-api-contracts` (`api/bridge/`) | Bridge-only API contract package |
| `@powerchain/swap-api-contracts` (`api/swap/`) | Swap-only API contract package |

All first-party packages remain version **1.0.0** unless the release policy is explicitly changed. Application-specific orchestration belongs under `apps/`.

- `@powerchain/bridge-core` — canonical off-chain Bridge intent rules mirrored by Solana/Sui auxiliary programs.

## Swap core

`@powerchain/swap-core` centralizes provider-neutral swap validation, base-unit math, quote protection, and execution-state transitions used by Jupiter, Cetus, SDK, and UI surfaces.
