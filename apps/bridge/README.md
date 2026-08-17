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

### Dependency build approvals

Dependency lifecycle scripts are fail-closed through pnpm `allowBuilds`. The reviewed `@google/genai` and `@reown/appkit` build scripts are source-controlled and can be reconciled non-interactively with:

```bash
pnpm deps:builds:approve:reviewed
pnpm deps:builds:check
```

If a local `pnpm dev` repair reports `ERR_PNPM_IGNORED_BUILDS`, run the reviewed approval command and retry. New/unreviewed lifecycle scripts remain blocked.

The dashboard application is the default local experience at `http://localhost:3000/`. `/dashboard` redirects permanently to `/`. The public `@powerchain/web` marketing site runs separately on `http://localhost:3001/` via `pnpm dev:web`.

## Development UI/runtime notes

- `pnpm dev` starts this app on port `3000` and clears stale Turbopack `.next/dev`/`.next/cache` state before launch.
- The Sui swap runtime is statically imported into the multichain swap client rather than loaded through `next/dynamic`, preventing stale async chunk references after HMR/restarts.
- Swap and Bridge use light cards, light-gray input surfaces, dark-green controls/icons in light mode, and matched low-glow dark surfaces in dark mode.
- Token selection uses an anchored searchable dropdown on desktop and a bottom-sheet picker on mobile.
- Chat messages are limited to 2,000 characters; link/image URL helpers, the counter, and send button live inside the composer.

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

## Claims and Status

- `app/claim/` is the interactive claim entry flow.
- `app/claims/status/[claimId]/` is the persisted claim-status recovery surface with loading/error boundaries.
- Claim API routes import the narrow `@powerchain/backend/claims` entry point rather than the backend root barrel.
- If `/claims/submit` times out or loses network connectivity after a reservation exists, the local operation journal advances to `UNKNOWN` and navigates to the persisted status page. The UI does not invite a second claim submission.
- `app/status/` uses reusable components under `components/status/`, normalized contracts in `types/status.ts`, `utils/health.ts`, `services/status.ts`, and the consolidated `use-status.ts` hook.
- Dashboard Settings controls a bounded 15/30/60/120 second status refresh preference and whether process-local provider telemetry is displayed. Status refresh is paused while offline, stale evidence is age-checked centrally, and repeated diagnostic messages are deduplicated. The Status route uses the full dashboard workspace with equal-height service cards and paired execution/request-policy panels; the header Runtime Status action shares the same 40px control height as the adjacent shell controls.

Status telemetry is operational evidence only. Provider counters, route-policy utilization, and status caching must never be treated as balance, reward, bridge-finality, or settlement evidence.

Operational route errors use `components/routing/route-error-panel.tsx`. Swap, Chat, Explorer, Protocol, Staking, and persisted Bridge Status provide route-level recovery while exposing only an opaque Next.js digest; raw provider/exception text is never echoed from these boundaries.

## Shared UI and theme

The application UI uses `styles/theme.css` plus shared `Card`/`Button`/form primitives. Controls use a 14px radius, cards 20px, and large application panels 24px. Settings, Claim, Status, Swap, Bridge, Protocol, DEX pool discovery, and wallet activity now consume those same geometry tokens and shared loading states rather than one-off radius/button implementations. Shared button classes can also be applied to `Link` navigation actions without duplicating visual contracts. Light mode uses a gray workspace, white cards, dark-green icons/actions and restrained layered shadows; dark mode retains equivalent hierarchy without changing execution semantics. Custom `swap-icon.tsx`, `bridge-icon.tsx`, and `dashboard-icon.tsx` provide consistent product-specific iconography.

## Route metadata

All primary application routes export an explicit title and description. `pnpm route-metadata:production:check` validates this surface so new route refactors cannot silently fall back to a generic browser title.

## Public error and recovery contract

Browser-facing wallet, chain-data, transaction and bridge APIs return fixed explanatory messages and machine-style codes. Provider URLs, RPC exception text and arbitrary upstream messages are not reflected to clients or bridge SSE streams. Bridge recovery links use `bridgeStatusRoute()` so persisted transfer IDs remain one validated route segment.

Bridge source-transaction attachment is limited to a 16 KiB JSON body and a 128-character signature/digest. Transfer event snapshots are capped at 100 entries per request. The shared browser bridge action helper accepts both legacy string-error and structured error envelopes while replacing network failures with fixed recovery copy.

Regression coverage:

```bash
pnpm public-error-contract:production:check
```

The app imports Sui RPC/balance primitives through `@powerchain/backend/sui/client`, keeping this server path off the broad backend barrel.

## Operational read hardening

Operational client reads are connectivity-aware and fail closed. Portfolio, pool, liquidity, and asset-integrity requests abort on offline transitions and preserve only previously verified snapshots. User-facing surfaces receive bounded machine-style state codes or fixed explanatory copy instead of arbitrary provider/browser exception text.

The Solana swap additionally requires a fresh source-balance observation before requesting a Jupiter route. This is a client preflight only; server-side route and transaction validation remain authoritative.

Regression coverage:

```bash
pnpm operational-read-hooks:production:check
```
