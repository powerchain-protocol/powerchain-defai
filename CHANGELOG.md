# Changelog
- Hardened pnpm 11.21.0 workspace configuration: local package linking/preference, workspace protocol saving, strict peers/engines/store integrity, cycle rejection, deterministic recursive installs, and workspace configuration validation.

## 1.0.0

### Operations hardening
- Hard-bounded worker ticks; timeout now stops the worker fail-closed instead of permitting a later overlapping tick.
- Cooperative shutdown checks between claim/fee jobs.
- Explicit Prisma 7 PostgreSQL driver-adapter pool configuration.
- Sanitized `/api/v1/workers/readiness` worker freshness endpoint.
- Updated Node 26 type definitions and stronger environment contract validation.

- Consolidated the PowerChain Bridge production monorepo.
- Added Solana/Sui provider pools, readiness, diagnostics and realtime fallbacks.
- Added PWRC/wPWRC real-chain data, wallet activity, Helius integration and explorer links.
- Added Token-2022 asset integrity, supply/authority/extension checks and chain freshness.
- Added governed service-fee policy, source-chain verification, revenue reconciliation and fee worker.
- Added server-authoritative trusted-wallet claim challenge/reservation/payout/finality flow.
- Added DB-backed quote/transfer intent, idempotency, runtime safety gates and status/history APIs.
- Added canonical `powerchain.operation-journal` recovery model without new journal versioning.
- Added Wallet Standard Solana provider, Mysten Sui dApp Kit provider, and Wormhole Connect NTT deployment boundary.
- Added production Bridge, Wallet, Claim, Assets, History, Fees and operation status pages.

### Production workspace hardening

- Fixed `apps/worker-fees/tsconfig.json` to extend the real root TypeScript configuration instead of a missing shared config.
- Added bounded integer environment parsing for fee/claim worker intervals, batch sizes, and lease durations.
- Hardened the shared worker supervisor with cooperative abort-based shutdown, bounded jittered backoff, iteration/failure context, and timer cleanup.
- Added `workspace:production:check` for manifest versions, tsconfig targets, environment-template duplication, relative source import integrity, and worker runtime policy.
- Added `syntax:check` to parse/transpile the full TypeScript/TSX source surface before the other production gates.
- Added `docs/VALIDATION.md` with the source-only and dependency-aware production release gates.

## Production dependency-aware hardening

- Normalized backend ESM imports to extensionless bundler-compatible imports.
- Fixed the bridge app TypeScript `baseUrl` so `@/*` resolves from `apps/bridge`.
- Added explicit Node type configuration to backend/database/runtime/worker workspaces.
- Fixed service-fee operator route authorization imports and error response argument ordering.
- Fixed strict `exactOptionalPropertyTypes` construction in governance/action-readiness flows.
- Made the Prisma 7 `prisma-client` generator explicit for Node.js + ESM and TypeScript import extensions.
- Added `validate:dependency-aware` and `validate:all` release gates.

- Pinned the workspace to pnpm 11.21.0 and added a package-manager preinstall guard.
- Moved the server-only `@powerchain/backend` workspace into `apps/backend` and updated aliases/checks.
- Made Next.js output explicitly `apps/bridge/.next` and hardened standalone tracing/Vercel commands.
- Added canonical root/app environment files/templates, migration parity checks, Prisma migration lock metadata, and clean/env/database scripts.

## Node / nvm tooling

- Pin local Node.js to 26.5.0 via `.nvmrc` and `.node-version`.
- Add nvm-aware local setup and runtime checks.
- Keep production-compatible Node engine range `>=24.18.0 <27` so Node 24 LTS deployments remain supported while local development uses Node 26 Current.
- Keep pnpm pinned to 11.21.0.

### Production platform hardening
- Added canonical `/api/v1/health`, `/api/v1/ready`, and `/api/v1/version` endpoints.
- Added database readiness probe and graceful Prisma disconnect support.
- Added worker tick timeouts and bounded cleanup timeouts to prevent hung workers during incidents or shutdown.
- Hardened Next.js production response headers and Prisma/pg server externals while keeping `.next` output and standalone packaging.
- Expanded clean targets to remove stale Next/build/coverage artifacts.
- Added `platform:production:check` and regenerated the API registry for the new routes.

### Failure-safety hardening

- Added bounded retry handling for PostgreSQL serialization/deadlock conflicts around critical serializable transactions.
- Made bridge transfer creation atomic per quote and idempotency key; competing reuse now fails with `QUOTE_ALREADY_USED`.
- Added a dedicated persisted claim-submit idempotency key so reserve and submit retries cannot be conflated.
- Unified claim mutation request IDs and response security headers.
- Prisma and Supabase migration mirrors must now be byte-identical.
- Added `pnpm failure-safety:production:check`.
