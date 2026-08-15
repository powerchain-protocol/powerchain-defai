# PowerChain Bridge™

Production source for **PWRC ↔ wPWRC** bridging between Solana and Sui using Wormhole NTT. All first-party packages are version **1.0.0**.

## Monetary invariant

- 1 PWRC principal on Solana maps to 1 wPWRC principal on Sui.
- 1 wPWRC principal maps to 1 PWRC principal on Solana.
- Service fees are a separate source-chain debit.
- Native chain gas is separate.
- Market, explorer, wallet-history and ordinary display RPC data are never bridge-accounting authority.
- Persisted finality and reconciliation evidence are the bridge completion/accounting authority.

## Repository

- `apps/bridge` — Next.js web application and `/api/v1` adapters.
- `apps/worker-claims` — claim submission/finality worker.
- `apps/worker-fees` — service-fee verification worker.
- `apps/backend` — claim payout, fee verification/control-plane and server business logic.
- `packages/database` — Prisma PostgreSQL client.
- `packages/runtime` — shared supervised-worker runtime.
- `prisma` / `supabase` — mirrored database migrations.
- `config/env` — canonical environment template.

## Requirements

- Node.js 26.5.0 for local development via nvm (`.nvmrc`); supported runtime range is >=24.0.0 <27
- pnpm 11.21.0
- PostgreSQL / Supabase-compatible PostgreSQL
- Dedicated Solana primary + independent fallback RPC
- Dedicated Sui primary + independent fallback RPC
- Real PWRC mint and wPWRC coin type
- Real deployed Wormhole NTT manager/transceiver/token configuration

No custom NTT address or program ID is invented by this repository. Missing production deployment configuration fails closed.

### Node / nvm

Local development is pinned by `.nvmrc` and `.node-version` to **Node.js 26.5.0**. Use nvm 0.40.6 or newer supported release:

```bash
nvm install
nvm use
node --version
pnpm node:check
pnpm nvm:check
```

The package engine range remains `>=24.0.0 <27` so the repository can run on Node 24 LTS in production platforms that have not enabled Node 26 yet, while local development tracks the latest Node 26 Current release.

## Setup

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:validate
pnpm db:migrate:deploy
pnpm workspace:production:check
pnpm syntax:check
pnpm full:production:check
pnpm check
pnpm build
pnpm start
```

For development:

```bash
pnpm dev
```

## Wallets

Solana uses Wallet Standard discovery through the Solana wallet-adapter provider. Sui uses Mysten dApp Kit React. Browser wallet RPC values are public and deliberately separate from server-only RPC credentials.

## Wormhole NTT

The bridge execution page embeds Wormhole Connect and requires `NEXT_PUBLIC_POWERCHAIN_NTT_CONNECT_CONFIG_JSON`. Configure it with a JSON object containing `chains`, `ntt`, `tokens`, `tokensConfig`, and optional public `rpcs`/UI settings. The application constructs the NTT Executor route plugin in code. The `ntt` block must contain the **actual deployed** Solana/Sui PWRC token, manager and transceiver identifiers. The configuration is browser-visible and must contain deployment identifiers only, never API secrets.

## Claims

Claims are server-authoritative:

1. server checks trusted-wallet allocation eligibility;
2. server issues a one-time challenge;
3. connected Solana wallet signs the challenge;
4. server verifies Ed25519 proof and atomically reserves allocation;
5. claim worker constructs exact Token-2022 payout with `POWERCHAIN_CLAIM:<claimId>` memo;
6. remote signer/HSM signs after simulation;
7. worker independently verifies finalized transaction details before marking the claim finalized.

Unknown submission outcomes are not blindly retried.

## Service fees

Fee policy is governance-controlled and immutable per issued quote. Fee settlement is verified independently on the source chain before transfer completion. The Solana fee wallet in the canonical configuration is:

`FeeszhrKKEsvxr1kg8LDtPx6BLcEbYHiAThYaxajNhqy`

The Sui fee wallet remains intentionally unset until a real governed Sui address is supplied.

## Operation recovery

The browser uses one canonical session recovery key/channel:

`powerchain.operation-journal`

It stores recovery metadata only. It does not contain keys, signatures, authorization proofs or provider credentials. Existing legacy suffixed keys are import-only compatibility aliases and are immediately normalized into the canonical key.

## Documentation and UI quality

The Bridge UI keeps the Wormhole NTT transfer action ahead of secondary diagnostics, exposes active navigation state, provides compact mobile wallet controls, and includes recoverable Bridge/History loading and error states. See `docs/UI_UX_REFINEMENT.md`.

Markdown quality is enforced in the repository rather than suppressed:

```bash
pnpm docs:fix
pnpm docs:lint
```

The Markdown gate includes MD012, MD022 and MD032 spacing checks.

## Production verification

```bash
pnpm workspace:production:check
pnpm syntax:check
pnpm full:production:check
pnpm verify:production
pnpm typecheck
pnpm build
```

The full-production gate checks versions, routes, workers, DB-backed bridge/claim paths, NTT configuration boundary, canonical journal, migration mirrors, browser secret boundaries, application pages and placeholder handlers.

## Canonical workspace layout

- `apps/bridge` — Next.js 16 web/API application; production build output is `apps/bridge/.next`.
- `apps/backend` — server-only business/domain services (`@powerchain/backend`).
- `apps/worker-claims` — claim payout/recovery worker.
- `apps/worker-fees` — fee verification worker.
- `packages/database` — Prisma/PostgreSQL boundary.
- `packages/runtime` — shared runtime/worker primitives.
- `prisma/` — canonical Prisma schema and migrations.
- `supabase/migrations/` — mirrored SQL migration set for Supabase deployments.

The root `.env.example` is the canonical environment contract. The bridge app contains the same browser/server template because Next.js loads environment files from its application root when run as a filtered workspace. Release/source archives must not contain `.env`, `.env.local`, or `.env.production`; deployment values belong in the runtime secret/configuration system.

## Workspace hardening

See `docs/WORKSPACE.md` for canonical pnpm 11.21.0 workspace settings, local linking, strict dependency checks, and CI lockfile policy.

## Protocol programs and integrations

- `programs/solana/powerchain_bridge` — auxiliary Anchor intent/audit program. It does not replace Wormhole NTT.
- `contracts/sui/powerchain_bridge` — auxiliary Sui Move intent/audit package.
- `packages/protocol` — canonical addresses, explorer helpers, signatures, fees, transaction IDs, validation and integration registry.
- `apps/bridge/config/integrations.ts` — browser-safe enablement flags for Cetus, Orca, Walrus, Meteora, Raydium and Jupiter.
- `apps/backend/src/bridge` — direct finalized-chain verification and Wormhole NTT correlation.

Custom PowerChain program/package IDs are placeholders until real deployments
are supplied. `pnpm protocol:sync` writes deployment IDs from environment values;
production validation must not treat placeholders as deployed addresses.

## Mixed npm/pnpm recovery

Do not run `npm update` in this workspace. If npm has already populated
`node_modules`, use `pnpm clean:package-manager`, remove workspace
`node_modules` folders, and run `pnpm install` again. See
`docs/BUILD_RECOVERY.md`.
