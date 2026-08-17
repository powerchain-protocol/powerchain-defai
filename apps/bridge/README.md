# @powerchain/bridge

PowerChain's full-stack Next.js application for wallet-owned Solana/Sui swaps, Wormhole NTT bridge lifecycle tracking, claims, staking, AI-assisted workflows, wallet data, and operator diagnostics.

## Runtime

Use the repository runtime exactly:

```bash
bash scripts/bootstrap-runtime.sh
```

The repository requires Node `>=24 <26`, pins Node `24.19.0` for reproducible development, and pins pnpm `11.22.0`. nvm is optional; PowerChain bootstraps pnpm directly and does not require Corepack.

## Install or repair the workspace

Run installation from the monorepo root. This app imports first-party `workspace:*` packages and is not intended to be copied out of the workspace with its package manifest alone.

```bash
pnpm workspace:bootstrap
```

If an earlier install failed or pnpm reports that workspace `node_modules` directories are out of sync with the lockfile, use the deterministic repair path:

```bash
pnpm workspace:repair
```

`workspace:repair` removes stale generated/module directories, runs a pnpm-only reinstall with a refreshed lockfile, checks reviewed dependency build scripts, refreshes Prisma Client, and validates the Prisma schema. It does **not** run database migrations.

## Standalone app routing

"Standalone" means the Bridge Next.js app is launched as a filtered application from the PowerChain monorepo. Its page and API routes live under `apps/bridge/app`, while shared route policy lives in first-party workspace packages.

```bash
pnpm --filter @powerchain/bridge dev:standalone
pnpm --filter @powerchain/bridge build:standalone
pnpm --filter @powerchain/bridge start:standalone
```

The Next.js launcher resolves `next/dist/bin/next` from this workspace and invokes it with the current Node executable. It does not depend on a globally installed `next` binary or an incidental shell `PATH` entry.

## Database-backed routes

The UI can start without running a migration command. Database-backed APIs and workers still require a reachable PostgreSQL database. Before applying migrations:

```bash
pnpm db:preflight
pnpm db:migrate:deploy
```

A failed `db:preflight` means the configured `DATABASE_URL` host/port is not reachable; fix/start PostgreSQL instead of reinstalling Next.js or Prisma.

## Sui and Pyth

Canonical Sui addresses, validation, gRPC/transaction primitives and chain utilities are owned by `@powerchain/blockchain` using `@mysten/sui`. Pyth signed-update retrieval is exposed through the same package via authenticated Hermes REST v2, without installing the separate `@pythnetwork/pyth-sui-js` package, preserving one canonical Sui SDK boundary. On-chain Pyth transaction construction remains feature-gated; Hermes data is oracle input only and never bridge finality evidence.
