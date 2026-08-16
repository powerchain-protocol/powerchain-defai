# PowerChain | DeFAI™

PowerChain | DeFAI is a version **1.0.0** monorepo for AI-assisted DeFi on **Solana and Sui**. It combines Swap, PWRC ↔ wPWRC Bridge, Staking, Portfolio, Liquidity, Assets, Fees, Wallets, operational tooling, and a read-only DeFi assistant.

The historical `apps/bridge` name remains the compatibility Next.js application shell. It does not mean the product is bridge-only. **Wormhole NTT remains the sole cross-chain principal-movement protocol for PWRC/wPWRC.**

## Shared swap core

`@powerchain/swap-core` is the provider-neutral contract for Solana and Sui swap validation. It centralizes base-unit amount math, slippage bounds, quote expiry, minimum-output protection, payer/asset normalization, fee constants, and execution-state transitions. Jupiter and Cetus remain provider adapters and the connected wallet remains the signer. See `docs/SWAP_CORE_ARCHITECTURE.md`.

## Architecture

```text
PowerChain DeFAI
├── apps/bridge          Next.js web/API shell
├── apps/backend         Canonical server-side domain services
├── apps/chat            DeFAI assistant feature package
├── apps/staking         Deployment-gated staking feature package
├── apps/worker-*        Thin supervised workers
├── packages/*           Database, protocol, runtime, SDK
├── clusters             Canonical Solana/Sui cluster registry
├── shared/blockchain    Shared chain/address/route primitives
├── api                  OpenAPI and Postman release contracts
├── programs/solana      Auxiliary Anchor program
└── contracts/sui        Auxiliary Move package
```

Execution boundaries are explicit:

- **Bridge:** Wormhole NTT owns cross-chain principal movement.
- **Swap:** Jupiter owns assembled Solana swap routing; Cetus owns Sui swap routing; connected wallets sign.
- **AI:** advisory only; it cannot sign, submit, finalize, or settle transactions.
- **Workers/indexers/explorers:** operational evidence only; they are not settlement authority.
- **Auxiliary Solana/Sui programs:** configuration, authority, pause, nonce, information-commitment, and intent/audit controls only.

See [`docs/DEFAI_ARCHITECTURE.md`](docs/DEFAI_ARCHITECTURE.md), [`docs/DEFAI_ECOSYSTEM.md`](docs/DEFAI_ECOSYSTEM.md), and [`docs/REAL_NTT_BRIDGE.md`](docs/REAL_NTT_BRIDGE.md).

## Requirements

- Node.js **24.x** (`.nvmrc` and `.node-version` use the Node 24 LTS line).
- pnpm **11.22.0** via Corepack.
- PostgreSQL or Supabase-compatible PostgreSQL.
- Real Solana RPC/WebSocket and Sui gRPC endpoints for production.
- Verified PWRC/wPWRC, Wormhole NTT, and auxiliary-program deployment identifiers.

The repository uses pnpm only. Do not add npm or Yarn lockfiles.

## Quick start

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.22.0 --activate
pnpm install

If TypeScript reports `Cannot find type definition file for 'react'`, run `pnpm install` from the workspace root rather than invoking an app with an incomplete dependency graph. The root workspace and React UI packages explicitly pin `react`, `react-dom`, `@types/react`, and `@types/react-dom`; `pnpm types:react:check` validates that contract.

pnpm env:bootstrap
pnpm prisma:generate
pnpm prisma:validate
pnpm db:migrate:deploy
pnpm dev
```

Or use the bootstrap helper first:

```bash
bash scripts/setup-local.sh
pnpm install
pnpm prisma:generate
pnpm prisma:validate
pnpm db:migrate:deploy
pnpm dev
```

`pnpm env:bootstrap` creates `.env` from `.env.example` only when `.env` does not already exist. Runtime `.env`, `.env.local`, and `.env.production` files are intentionally excluded from releases.

## Common commands

```bash
pnpm dev                         # Next.js DeFAI shell
pnpm dev:backend                 # backend workspace development task
pnpm dev:workers                 # Bridge/Claims/Fees workers
pnpm typecheck                   # workspace TypeScript checks
pnpm docs:fix                    # normalize Markdown spacing
pnpm verify:production           # source-level production gates
pnpm validate:dependency-aware   # Prisma + typecheck + production build
pnpm release:check               # route/Postman/release + production gates
```

For dependency lifecycle-script review:

```bash
pnpm deps:builds:status
pnpm deps:builds:approve
```

Approved build dependencies are source-controlled through pnpm `allowBuilds`.

## Application domains

| Domain | Runtime namespace | Primary implementation |
| --- | --- | --- |
| DeFAI assistant | `/chat`, `/api/v1/chat` | `apps/chat`, backend DeFAI service |
| Swap | `/swap`, `/api/v1/swap/*` | Jupiter on Solana, Cetus on Sui |
| Bridge | `/bridge`, `/api/v1/bridge/*` | Wormhole NTT |
| Staking | `/staking`, `/api/v1/staking/*` | fail-closed until verified deployment |
| Portfolio / Assets | `/assets`, `/api/v1/portfolio/*` | trusted-token + chain data services |
| Liquidity / Pools | Assets/Liquidity UI, pool APIs | Raydium, Meteora, Orca, Cetus observations |
| Operations | `/integrations`, `/api/v1/operations/status` | persisted worker/database/queue readiness |

Bridge and Swap APIs are intentionally separated at runtime, router-policy, SDK, OpenAPI, and Postman boundaries. Shared services such as currencies, RPC, prices, rates, security, trusted tokens, and clusters remain common infrastructure.

## API contracts

Root API tooling lives under [`api/`](api/README.md):

```text
api/
├── swagger.yaml               Combined DeFAI OpenAPI contract
├── postman/                   Combined Postman collection/environments
├── bridge/                    Bridge-only OpenAPI/Postman contract
└── swap/                      Swap-only OpenAPI/Postman contract
```

Runtime OpenAPI endpoints:

```text
GET /api/v1/openapi
GET /api/v1/bridge/openapi
GET /api/v1/swap/openapi
```

Production Postman defaults are configured for:

```text
https://powerchain.app
https://swap.powerchain.app
https://bridge.powerchain.app
```

API-key enforcement uses `X-Api-Key` and is controlled by `POWERCHAIN_API_KEY_MODE=off|optional|required`. Never expose API keys through `NEXT_PUBLIC_*`.

## Networks, assets, and RPC

Canonical chain and cluster definitions live in:

- `clusters/` — Solana/Sui mainnet, testnet, devnet, localnet definitions.
- `shared/blockchain/` — address normalization and supported cross-chain directions.
- `apps/backend/src/services/rpc.ts` — Solana HTTP/WebSocket failover and Sui readiness.
- `apps/backend/src/services/currencies.ts` — fiat/crypto/stablecoin metadata and Pyth mapping.
- `apps/backend/src/data/trusted-token-list.ts` — executable token allowlist.

Trusted stablecoins include Circle USDC on Solana and Sui, and Circle EURC on Solana. Market prices and rates are informational and never Bridge accounting authority.

See [`docs/STABLECOINS_PYTH_RPC.md`](docs/STABLECOINS_PYTH_RPC.md) and [`docs/CROSS_CHAIN_CLUSTERS.md`](docs/CROSS_CHAIN_CLUSTERS.md).

## PWRC / wPWRC integrity

The canonical token-information model is stored in `config/token.json` and bound to the SHA-256 information commitment:

```text
f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5
```

The same commitment is used by token metadata, protocol asset definitions, runtime verification, SDK types, auxiliary program state, OpenAPI, and `build-manifest.json`.

Token metadata lives under [`tokens/metadata/`](tokens/metadata/README.md). Deployment-specific Sui package/object IDs and Wormhole identifiers are never fabricated.

See [`docs/TOKEN_INFORMATION_COMMITMENT.md`](docs/TOKEN_INFORMATION_COMMITMENT.md).

## Bridge safety

The default route is **Sui wPWRC → Solana PWRC**; the reverse direction is also supported when the verified NTT deployment is configured.

A Bridge completion requires persisted finality and NTT reconciliation evidence. RPC dashboards, explorers, AI responses, DEX data, and worker health are not finality authority.

The configured Solana auxiliary program ID is:

```text
BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS
```

Its governed signer is configured separately with `POWERCHAIN_SOLANA_BRIDGE_AUTHORITY`. The Sui Move source intentionally keeps its named address at `0x0` until a verified package is published and supplied through runtime configuration.

See [`docs/BRIDGE_AUTHORITY.md`](docs/BRIDGE_AUTHORITY.md), [`docs/BRIDGE_OPERATIONS.md`](docs/BRIDGE_OPERATIONS.md), and [`contracts/sui/powerchain_bridge/README.md`](contracts/sui/powerchain_bridge/README.md).

## UI/UX and product safety

The application uses a cinematic light-first white/light-gray/forest/onyx design with a persistent dark theme. Operational content remains legible and evidence-based; synthetic TVL, TPS, success-rate, APR, or security claims are not fabricated.

The app includes remembered cookie consent, legal/privacy/risk pages, feature and route error boundaries, toast/notices, offline-aware status surfaces, and pseudonymous platform-derived abuse-prevention keys.

See [`docs/UI_UX_REFINEMENT.md`](docs/UI_UX_REFINEMENT.md) and [`docs/PRODUCT_SAFETY_LEGAL.md`](docs/PRODUCT_SAFETY_LEGAL.md).

## Validation and releases

Source-level release checks:

```bash
pnpm docs:fix
pnpm verify:production
```

Dependency-backed release checks:

```bash
pnpm validate:dependency-aware
```

A production release must not claim Prisma generation, TypeScript dependency resolution, Next.js build, Anchor build, or Sui Move build succeeded unless those commands actually ran in the intended toolchain.

The root keeps only the primary project Markdown files: `README.md`, `CHANGELOG.md`, and `CONTRIBUTORS.md`. Detailed documentation belongs in [`docs/`](docs/README.md) or the owning workspace.

## Provider and feature configuration

PowerChain normalizes provider URLs, official Solana program IDs, feature flags, cache TTLs, cross-chain provider policy, AI providers, notifications, storage readiness, and realtime policy through typed backend configuration. See [Environment, providers, features, and runtime policy](docs/ENV_PROVIDER_FEATURES.md).

The PWRC/wPWRC Bridge remains gated by Wormhole NTT. CCTP is scoped to supported stablecoins; LayerZero does not become a PWRC principal-movement route. Production secrets belong in deployment secret management, never the checked-in examples.

## Monorepo/program core

`@powerchain/bridge-core` centralizes off-chain intent invariants consumed by the backend and mirrored by the Solana/Sui auxiliary programs. See `docs/MONOREPO_PROGRAM_ARCHITECTURE.md`.

See [`docs/POSTMAN_FLOWS_ARCHITECTURE.md`](docs/POSTMAN_FLOWS_ARCHITECTURE.md) for the Postman master/preflight/Swap/Bridge workflow architecture.
