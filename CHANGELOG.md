# Changelog

## 2026-08-17 — Dependency build approvals and dashboard/website visual polish

- Approved the reviewed `@google/genai` and `@reown/appkit` lifecycle builds in the source-controlled pnpm `allowBuilds` policy, added explicit non-interactive approval helpers, and made local workspace auto-repair reconcile reviewed build approvals before reinstalling.
- Matched the Runtime Status header action to the 40px dashboard control height and widened/flattened the Status layout so cards use the shell workspace more efficiently across mobile, tablet, and wide desktop breakpoints.
- Refined Status overview/service cards with equal-height grids, responsive metrics, and paired execution-envelope/request-policy panels.
- Changed the website light-theme primary action to dark green, kept secondary actions white, and converted the final marketing CTA into a dark-green card with white/ghost buttons.
- Elevated Solana, Sui, Pyth, and Supabase in the ecosystem section with branded icon treatment and resilient logo fallbacks.

## 2026-08-17 — Public error contracts and bridge recovery hardening

- Hardened browser/API error boundaries so wallet, chain-data, transaction, bridge-config, bridge-route and SSE surfaces return stable public codes with generic messages instead of reflecting provider/RPC exception text.
- Added `public-error-contract:production:check` and wired it into `verify:production` to prevent raw-error reflection, manual bridge-status route construction, unbounded transfer-event queries and regression of bridge error-envelope parsing.
- Refactored active/resumable bridge recovery, transfer deep links, NTT execution, wallet action readiness and wallet portfolio actions onto shared Card/Button/Badge/Alert geometry and canonical `bridgeStatusRoute()` navigation.
- Bounded source-transaction JSON payloads, source signature/digest length and transfer-event limits; request IDs are normalized through the shared server HTTP contract.
- Added a narrow `@powerchain/backend/sui/client` export and moved bridge-side Sui RPC/balance consumers off the backend root barrel.
- Extended shared Card semantics so cards can render as `section`, `aside` or `article` landmarks without duplicating presentation styles.

## 2026-08-17 — Shared operational surfaces and route metadata

- Added reusable `Badge` and link-compatible `buttonClassName()` primitives so buttons and navigation actions share one interaction geometry.
- Refactored Protocol verification, DEX pool discovery, cross-chain wallet activity and portfolio actions onto shared Button/Tabs/Select/Badge surfaces with safer public error copy.
- Added explicit title/description metadata to all 16 primary operational routes and a `route-metadata:production:check` regression guard.
- Improved the public website product catalog so product-specific cards hand users into allowlisted `/open/[slug]` app destinations instead of remaining presentation-only.
- Normalized additional alert/panel radii onto the shared 14px/20px/24px theme system and hardened external wallet-history links with `noopener noreferrer`.

### Operational polish and account recovery

- Added Profile and Settings route-level loading/error boundaries using the shared safe recovery panel.
- Refactored browser profile and service-fee estimator surfaces onto shared Card/Input/Select/Button geometry.
- Hardened settings endpoint tests so raw browser/provider exception strings are not reflected into the UI.
- Added 256 KB settings-import bounds and generic invalid-import feedback.
- Improved token-picker focus restoration and query reset across keyboard, backdrop, selection and close-button paths.
- Added request cancellation and bounded route-ID validation to the service-fee estimator.

## 2026-08-17 — Operational route and UI resilience

- Added shared operational route recovery for Swap, Chat, Explorer, Protocol, Staking, and persisted Bridge Status, including a loading boundary for transfer-status recovery.
- Route error surfaces expose only opaque framework digests and canonical History/Status recovery links; raw exception messages remain hidden.
- Refactored Explorer and History filtering onto shared Card/Input/Select/Button geometry and canonical safe transfer-status route construction.
- Hardened provider health/readiness hooks to abort in-flight requests when the browser goes offline and made aggregate Status refresh tolerant of independently failing probes.
- Standardized Card, Tabs, Dropdown, Pagination, Empty State, and route-loading geometry on the shared theme radius tokens.
- Added a production guard for operational route boundaries and safe transfer-detail routing.

## 2026-08-17 — Claim recovery and UI consistency hardening

- Hardened claim submission recovery so ambiguous timeout/network failures after a successful reservation are journaled as `UNKNOWN` and routed to the persisted claim-status surface instead of encouraging a duplicate claim.
- Improved operational Status with offline-aware manual refresh, centralized age-based stale detection, deduplicated diagnostics, and expandable operator error context.
- Hardened shared runtime helpers: `TTLCache` now distinguishes a cached `undefined` value from a miss, validates TTL/capacity inputs, and preserves per-cache in-flight de-duplication; public server error codes now accept only explicit machine-style codes.
- Added loading semantics to the shared Button primitive and migrated Settings endpoint tests, selectors, portability actions, Claim lifecycle controls, and transaction surfaces toward the shared 14px/20px/24px geometry system.
- Aligned Swap and Bridge pay/receive, route, fee, and action surfaces with the shared light/dark card geometry while retaining the dimensional center swap/reverse controls.
- Extended Claim production checks to enforce ambiguous-submission recovery behavior.

## 2026-08-17 — Self-healing local development install

- Added `workspace:install:ensure` for local development. It probes critical workspace modules and performs one root `pnpm install --no-frozen-lockfile` when a fresh/stale checkout is missing dependencies.
- `pnpm dev`, direct Bridge/backend/worker dev commands and `dev:stack` now use the local ensure step instead of failing immediately on a missing `node_modules`.
- Build, typecheck, CI and release flows remain strict and non-mutating through `workspace:install:check`.
- Automatic local installation can be disabled with `POWERCHAIN_AUTO_INSTALL=0`; explicit `workspace:repair` remains the clean lockfile/module re-resolution path.
- Removed duplicated install/env/database preflight text from root command bodies; lifecycle hooks remain the canonical preflight entry points, while package-level hooks still protect direct workspace commands.

## 2026-08-17 — Sui wallet lifecycle + dashboard navigation UX

- Fixed the React render-phase update error by removing `createDAppKit()` from `SuiWalletRuntime` render/useMemo; custom Sui RPC kit instances are now created after commit in an effect while the canonical kit stays module-scoped.
- Promoted `/dashboard` from a compatibility redirect to a canonical command-center page.
- Added a dedicated dashboard shell with its own sidebar, header, simple footer, wallet/runtime connectivity overview, and quick operational shortcuts.
- Reorganized the main application sidebar into Overview, Intelligence, Markets, Portfolio, Network, and Account sections, with the same grouped structure in the mobile drawer.
- Added a Sui wallet React lifecycle production guard and updated routing/UI checks for the separated workspace/dashboard shells.

## 2026-08-17 — Node 24/25 engine + complete API contract upgrade

- Standardized all 19 package manifests on `node >=24 <26` and `pnpm >=11.22.0 <12`; reproducible development now pins Node `24.19.0`.
- Updated bootstrap, CI, Dev Container, doctor/release guards, and runtime documentation to the same engine contract.
- Reworked the root README so `pnpm install` and the bootstrap-based Quick Install are the first workflows shown.
- Restored fail-fast `dev:stack` sequencing so workspace dependencies, environment, Prisma, and PostgreSQL are validated before worker fan-out.
- Upgraded `/api` generation: the combined OpenAPI contract now covers all filesystem routes/actions, includes operation IDs, path parameters, standard error responses, and Bridge/Swap subsets generated from the same registry.
- Runtime `/api/v1/openapi` now fills undocumented routes from the generated filesystem route registry instead of silently omitting new handlers.
- Added `api:check` and `api:production:check` and wired API contract completeness into the production verification chain.
- Fixed the local PostgreSQL production guard typo so it validates the actual `127.0.0.1:5432` Compose binding.

## 1.0.0 — Database and Cetus adapter compatibility

- Removed the Node-26-incompatible Cetus Aggregator SDK dependency from the backend workspace and replaced it with a trusted remote Cetus quote/unsigned-transaction adapter boundary.
- Upgraded `axios` to `1.19.0` and `@mysten/dapp-kit-react` to `2.1.19`.
- Upgraded PostgreSQL client ownership to `pg@8.23.0` / `@types/pg@8.20.0` and added explicit `@prisma/client@7.9.1`, `@prisma/adapter-pg@7.9.1`, and `@supabase/supabase-js@2.110.8` dependencies.
- Added a server-only Supabase client boundary and a non-hidden `config/env.defaults` bootstrap fallback for checkouts that omit `.env.example`.

## 1.0.0 — React, AI and shared UI modernization

- Upgraded React/React DOM to `19.2.8` with `@types/react@19.2.18` and `@types/react-dom@19.2.4`.
- Added `ai@7.0.66` to `@powerchain/chat`, `openai@7.4.0` and `@google/genai@2.17.0` to the server backend, with DeepSeek using the official OpenAI-compatible client.
- Added Radix Icons `1.3.2` and centralized icon exports for the application/chat UI.
- Expanded the root AI environment schema while keeping provider credentials server-only and generated `.env` files ignored.
- Strengthened `@powerchain/staking` with shared blockchain/runtime dependencies and aligned Solana Kit/Sui SDK versions.
- Consolidated setup and recovery into the root README and removed the separate root installation document.

## 1.0.0 — backend dependency modernization

- Upgraded the backend Sui/Cetus stack to `@cetusprotocol/aggregator-sdk@1.7.0` and `@mysten/sui@2.26.1`.
- Upgraded Solana Kit to `@solana/kit@7.1.0` and wired backend RPC health probes through the canonical Kit `createSolanaRpc` primitive.
- Upgraded workspace tooling to TypeScript `7.0.2`, `tsx@4.23.12`, and `@types/node@26.2.0`.
- Upgraded environment/WebSocket dependencies to `dotenv@17.4.2` and `ws@8.21.3`.
- Restored the runtime contract to Node `>=26 <27` with the reproducible Node `26.7.0` pin and aligned CI, Dev Container, bootstrap, package metadata, and release guards.
- Added a backend-stack production gate that rejects stale Cetus 1.6.1, Sui 2.24.0, Solana Kit 7.0.0, and the Node-24-only Hermes 3.1.0 lockfile surface.
- Kept Pyth data retrieval behind the authenticated Hermes REST boundary; `@pythnetwork/pyth-sui-js` remains excluded from the canonical Sui runtime.

## 2026-08-17 — zero-assumption toolchain and Compose recovery

- Added `source ./bootstrap.sh` / `scripts/bootstrap-toolchain.sh` to install a checksum-verified Node 26.7.0 user-local runtime and pnpm 11.22.0 without requiring nvm, Corepack, or administrator access.
- Added `./pnpmw` so pnpm workspace commands can run from a shell where `pnpm` is initially missing.
- Added a Compose command wrapper that prefers `docker compose` and emits a clear no-Docker fallback instead of assuming the legacy `docker-compose` executable exists.
- Replaced VS Code Docker Compose startup tasks with PowerChain bootstrap/dev tasks; Dev Containers continues to own its Compose lifecycle.
- Renamed the runtime production marker away from nvm-specific terminology and updated installation/recovery documentation accordingly.

## 2026-08-17 — PowerChain DeFAI rename and Node 24 pnpm bootstrap

- Normalized the repository identity to `powerchain-defai` for workspace mounts, database application identity, documentation, and repository-level development paths while retaining Bridge as an application/domain module.
- Consolidated setup, runtime, environment and recovery guidance into the root `README.md`.
- Added a Dev Container Dockerfile that provisions pnpm `11.22.0` on Node 24 before post-create setup, eliminating the `pnpm: command not found` failure.
- Removed active Corepack dependencies from Node 24 setup, CI, and deployment tooling; nvm is now optional rather than required.
- Updated the Dev Container mount to `/workspaces/powerchain-defai`, retained internal-only PostgreSQL credentials/ports, and preserved the generated ignored database environment.
- Migrated GitHub CI to `pnpm/setup@v1` with pinned pnpm `11.22.0` and Node `26.7.0`.

- Added a safe local full-stack bootstrap (`scripts/dev-stack-bootstrap.sh`) that activates Node 26.7.0/pnpm 11.22.0, repairs the workspace, provisions localhost PostgreSQL through `compose.dev.yaml`, applies checked-in Prisma migrations, and starts the Bridge plus workers.
- Added `db:local:*` pnpm commands with localhost-only infrastructure mutation guards and clearer database/workspace preflight recovery guidance.

## 2026-08-17 — Node 26 / pnpm engine + CSV-only dataset recovery

- Added a sourceable `scripts/activate-runtime.sh` recovery path that recreates missing `.nvmrc` / `.node-version`, activates Node 26.7.0 in the current shell, and pins pnpm 11.22.0.
- Added `scripts/recover-workspace.sh` / `pnpm workspace:recover` so stale installs can be repaired without relying on hidden runtime files.
- Updated workspace install errors to avoid bare `nvm use` instructions when the runtime marker files may be missing.

- Hardened dev-stack startup with a critical workspace dependency preflight, canonical pnpm repair instructions, schema-hash Prisma generation freshness, and source fixes for route PUT typing, CrossChainPair field drift, exact optional properties, DEX persistence typing, price/rate result narrowing, and backend barrel collisions.
- Added full-stack startup preflight for workspace dependency resolution, environment bootstrap, Prisma freshness, and PostgreSQL reachability so `pnpm dev:stack` fails once before spawning watchers/workers when the checkout is incomplete.
- Added first-party TypeScript path coverage for bridge-core/chat/staking/SDK packages and hardened backend types around Prisma transaction delegates, Sui wait results, operator queues, bridge history, and fee reconciliation.

- Raised every workspace engine contract to `node >=26 <27` and `pnpm >=11.22.0 <12`; root `.nvmrc` and `.node-version` now pin Node `26.7.0`.
- Kept MIT licensing across all 19 package manifests and the canonical root `LICENSE`.
- Hardened `pnpm workspace:repair` to delete a stale lockfile before dependency resolution so removed transitive surfaces such as deprecated `aptos@1.22.1` cannot survive only because of an old lock graph.
- Converted the source-controlled Postman dataset surface to CSV-only and removed JSON/XLSX dataset duplicates.
- Retained deterministic Next.js CLI resolution; a missing Next binary now indicates an incomplete workspace install rather than a PATH lookup defect.

## Runtime/install recovery and Sui oracle dependency hardening

- Changed every workspace package license to MIT and added the canonical root `LICENSE`.
- Raised the Node 24 engine floor to `>=24 <26` and pinned `.nvmrc` / `.node-version` to `26.7.0`, avoiding React Native 0.87 rejection on Node 24.0.0.
- Added `pnpm workspace:repair` for stale or partially installed pnpm workspaces; it refreshes dependencies/lockfile and Prisma Client without running migrations.
- Made the Bridge Next.js launcher resolve `next/dist/bin/next` from the app workspace instead of requiring a global or incidental `next` binary on `PATH`.
- Added a database connectivity preflight before deploy migrations so an unavailable local PostgreSQL server fails with an actionable boundary before Prisma migration execution.
- Removed the broad Wormhole Connect dependency surface that introduced deprecated Aptos packages; the Bridge uses PowerChain quote/persist/status lifecycle plus an optional reviewed NTT execution URL.
- Standardized Sui primitives on `@mysten/sui` and added reviewed `@pythnetwork/pyth-sui-js` Hermes signed-update support through `@powerchain/blockchain`.
- Added filtered standalone Bridge lifecycle documentation and an install/runtime production regression gate.

## 2026-08-17 — Node / MIT / Sui-Pyth install recovery

- Changed every workspace package license to `MIT` and replaced the proprietary notice with the canonical MIT `LICENSE`.
- Pinned `.nvmrc` / `.node-version` to Node `26.7.0` and raised `engines.node` to `>=24 <26` so `react-native@0.87.0` no longer rejects Node 24.0.0.
- Reworked the Next CLI wrapper to resolve `next/dist/bin/next` from the filtered app workspace instead of depending on a `.bin` PATH entry, fixing `spawnSync next ENOENT` after a valid pnpm install.
- Removed the broad `@wormhole-foundation/wormhole-connect` browser dependency that brought deprecated Aptos packages into the Solana/Sui-only app.
- Upgraded `@mysten/sui` to `2.26.1`, added `@pythnetwork/pyth-sui-js`, and isolated Pyth Hermes signed-update retrieval from the canonical Mysten Sui v2 RPC/transaction layer.
- Added `pnpm db:preflight` so an offline PostgreSQL target fails with an actionable message before Prisma migration execution.
- Added filtered `dev:standalone`, `build:standalone`, and `start:standalone` bridge-app lifecycle commands while keeping pnpm workspace ownership.

All notable changes to PowerChain DeFAI are documented here. The project remains at version **1.0.0**.

## 2026-08-17 — Postman datasets, method collections, and README cleanup

- Added a generated Postman HTTP-method collection with canonical `GET`, `POST`, and `PUT` folders plus sanitized saved response examples for all registered API actions.
- Expanded local and production Postman environments to expose the complete collection-variable surface; local `baseUrl`, `swapUrl`, and `bridgeUrl` now all resolve to `http://localhost:3000` to prevent accidental production fallback.
- Added source-controlled Postman dataset inputs in CSV, JSON, and XLSX formats plus dataset metadata and pnpm generation/check commands.
- Recorded the configured Postman workspace/specification identifiers without making remote Postman state a release-time dependency.
- Reworked the README worker lease/heartbeat section, documented the Postman release surface, reinforced pnpm-only workflows, and retained the root `.nvmrc` / `.node-version` Node 24 contract.

## 2026-08-17 — runtime trust and deploy smoke hardening

- Fixed production smoke authentication for `POWERCHAIN_API_KEY_MODE=required` with `POWERCHAIN_SMOKE_API_KEY` support.
- Production smoke now requires HTTPS outside localhost and rejects credential/path/query-bearing base URLs.
- Aligned runtime API-key validation with the actual 24-256 character authorization bounds and duplicate-key rejection.
- Added explicit Cloudflare runtime identity and canonical `CF-Connecting-IP` handling through pseudonymous IP security.
- Removed raw `CF-Connecting-IP` / `X-Real-IP` reads from the durable database-backed rate limiter.
- Added `/api/v1/version` to the canonical route-policy registry and extended production gates for these invariants.

## 2026-08-17 — protocol runtime isolation

- Improved Protocol runtime isolation with per-program verification endpoints, independent card refresh, checked-at/latency evidence, core/optional filtering, and failure isolation so one optional verifier cannot take down aggregate program readiness.

## Runtime environment and deployment hardening

- Split environment-template validation (`env:schema:check`) from live production configuration validation (`env:runtime:check`).
- Production preflight now rejects localhost database/RPC endpoints, weak API-key mode, non-mainnet network selection, and incomplete Wormhole NTT deployment identifiers when cross-chain execution is enabled.
- Hardened deployment smoke tests with bounded retry/backoff and required security-header validation.
- Clarified `@powerchain/backend` as a server-side domain/integration library rather than a standalone HTTP process.
- Added environment schema validation to the source-only CI repository-contract job.

## 2026-08-17 — workspace metadata and governance hardening

- Added an explicit proprietary `LICENSE` matching the private `UNLICENSED` package policy.
- Added `docs/SECURITY.md` with wallet-signing, secret-management, runtime-verification, lockfile, and production-promotion boundaries.
- Added `docs/CONTRIBUTING.md` with the canonical Node 26 / pnpm workflow and repository hygiene rules.
- Added `engines.node: ">=24 <25"` to every workspace package so package-level tooling sees the same runtime contract as the root.
- Extended package metadata validation to enforce the Node engine and proprietary license notice.
- Normalized package manifest ordering and removed empty/dead source directories.

## 2026-08-17 — package metadata and repository cleanup

- Added production-grade `description`, `license`, and `author` metadata to all 19 root/workspace `package.json` manifests.
- Standardized private package licensing on `UNLICENSED` so the repository does not accidentally grant an open-source license.
- Added `metadata:production:check` and wired it into the production verification chain.
- Expanded `pnpm clean` to recursively remove generated build output, caches, logs, editor/OS debris, temporary files, and TypeScript build info across the monorepo.
- Expanded `.gitignore` coverage for generated/tooling debris and regenerated release integrity metadata.

## 2026-08-17 — pnpm monorepo production hardening

- Fixed strict-workspace dependency ownership for `@powerchain/runtime` and `@powerchain/bridge-core` imports so clean pnpm installs do not rely on accidental root dependency visibility.
- Fixed Prisma/Supabase migration drift for runtime maintenance state and restored byte-identical mirrored migrations.
- Moved `tsx` into each worker's runtime dependencies because production `start` commands load TypeScript through `node --import tsx`.
- Added a workspace dependency-boundary production gate that rejects undeclared source imports and production start commands backed only by dev dependencies.
- Added a fail-closed pnpm lockfile production gate to release/deploy preflight; frozen-install deployments can no longer proceed without a reviewed `pnpm-lock.yaml`.
- Added pnpm-managed Node 24 runtime metadata while retaining `.nvmrc`, `.node-version`, `engines`, and the pinned pnpm 11.22.0 package-manager contract.

## 2026-08-17 — worker drain mode

- Added fail-closed worker drain mode for controlled deployments: workers keep heartbeats, claim no new jobs, and aggregate readiness blocks new operations/async settlement while draining.

## 2026-08-17 — worker queue backpressure and shutdown ownership

- Hardened worker batching/backpressure: just-in-time claims, shutdown-safe lease renewal, queue pressure readiness, and async-settlement gating under high backlog.

## 2026-08-17 — staking runtime UX and transaction recovery

- Harden worker execution with periodic background heartbeats and owner-qualified lease renewal for bridge, claims, and service-fee jobs; long RPC operations no longer become reclaimable solely because the initial lease window elapsed.

- Added abort-safe, focus/online-aware 30-second staking runtime refresh while retaining the server-verified initial snapshot.
- Distinguished a missing Token-2022 ATA (`0 PWRC`) from RPC/balance-read failures (`Unavailable`) instead of silently converting provider failures into zero balances.
- Added verified minimum-stake, wallet-balance and active-position amount guards before wallet invocation plus 25%/50%/75%/Max amount shortcuts.
- Added single-flight transaction submission protection and explicit ambiguous-confirmation recovery that preserves the transaction signature and warns against blind retry.
- Added blockheight-aware confirmation error handling and refreshes wallet position/runtime evidence after confirmed or ambiguous submissions.
- Added lifecycle cancellation to staking status/position fetches and a dedicated staking runtime UX production gate.

## 2026-08-16 — light-first staking workspace upgrade

- Rebuilt `/staking` around the supplied PowerChain staking reference while keeping light theme as the default and dark as the alternate theme.
- Replaced synthetic APY/validator/earnings displays with RPC-verified total staked, reward-vault funding, reward policy, minimum stake, cooldown, wallet balance and wallet-position state.
- Added read-only `/api/v1/staking/position` verification with PDA, discriminator, program-owner and wallet-owner checks.
- Added verified pool metrics to `@powerchain/staking` and a staking UI production gate.
- Kept all stake/unstake/withdraw/claim actions wallet-signed and deployment-revalidated immediately before submission.

- Added canonical backend routing policy, request-security helpers, validated price/rate services, exact base-unit calculators, and versioned rates/calculator/security APIs; market data remains non-authoritative for Bridge accounting.

- Added typed provider/feature configuration for official Solana programs, Jupiter/Raydium compatibility endpoints, CoinGecko, Pyth aliases, Sui compatibility settings, cross-chain provider flags, S3 readiness, AI providers, notifications, bounded cache TTLs, WebSocket policy, and feature gates.
- Added CoinGecko market-data integration, Resend mail fallback, runtime Swap/Bridge feature enforcement, and canonical official Solana program validation.
- `SWAGGER_API_KEY` is supported only as a server-side compatibility alias for `X-Api-Key`; the user-supplied key is intentionally not stored in source and should be rotated because it was shared in chat.

### Monorepo, contracts and programs

- Added `@powerchain/bridge-core` for canonical bridge intent validation and direction codes.
- Refactored Solana and Sui intent guards into reusable program functions.
- Added version-2 observability events with chain context while preserving existing config layouts.
- Hardened information-commitment version checks and kept Wormhole NTT as the sole principal movement protocol.

### Runtime evidence and operational diagnostics

- Added RPC-evidence-driven Solana escrow readiness; configuration alone can no longer make the escrow rail executable.
- Added per-checkout verification for the escrow PDA, allowlisted-mint PDA, extensions PDA, vault PDA, program ownership, account versions, allowlist state, SPL/Token-2022 mint ownership, and receipt PDA derivation on one consistent RPC endpoint.
- Added canonical typed provider diagnostics to the endpoint registry, backend client, runtime validators, API route, and Integrations UI. Diagnostics are explicitly process-local and non-authoritative for accounting/settlement.
- Standardized the staking status route on the common API envelope while preserving compatibility in wallet consumers.
- Extended Solana staking deployment verification across the configured RPC fallback pool while requiring the full program/config/vault/reward proof to succeed on a single endpoint.
- Improved realtime liveness so valid application traffic acknowledges socket activity without fabricating protocol-level pong observations.

### Runtime/lifecycle hardening

- Added schema-aware, concurrency-safe `prisma:ensure`; root and filtered workspace lifecycles no longer perform redundant unconditional Prisma generation.
- Added `dev:all`, `build:monorepo`, workspace TypeScript coverage checks, and typecheck scripts for `@powerchain/database` / `@powerchain/runtime`.
- Made the database module boundary lazy so Next.js route analysis does not require `DATABASE_URL` until actual database access.
- Added generation-safe WebSocket event handling to ignore stale socket events after restart/failover.
- Removed signer privilege forwarding from configurable Solana escrow hook CPIs.
- Updated staking documentation to reflect the wallet-signed, deployment-reverified Solana action path.

## 1.0.0

### Verified staking runtime and Solana program

- Added `programs/solana/powerchain_staking` with canonical PWRC Token-2022 stake/reward vaults, wallet-owned positions, funded fixed-pool rewards, cooldown withdrawals, reward claims, pause/authority controls, and no minting/inflation path.
- Moved the staking reward allocation cap and live reward-rate truth to verified on-chain config; source code no longer invents an allocation amount or APR/APY.
- Added runtime RPC verification for the executable Solana program, program-owned config, canonical stake/reward vaults, reward funding/distribution invariants, and on-chain rate/epoch values.
- Added `types/staking.ts` verification/reward models, `config/staking.json`, the staking program-ID synchronization helper, updated Staking UI/API status, and dedicated production checks.
- Kept Sui staking fail-closed until real package/pool/reward object identifiers and a runtime verifier exist; no convincing placeholder deployment identifiers are introduced.
- Fixed `packages/protocol/src/integrations.ts` so optional integration fields are omitted rather than explicitly set to `undefined` under `exactOptionalPropertyTypes`.

### Hooks, exact optional types, and realtime resilience

- Fixed React 19 `Expected 1 arguments, but got 0` diagnostics by explicitly initializing optional provider/component state.
- Fixed operation-journal `exactOptionalPropertyTypes` violations by omitting absent `id`, `revision`, server metadata, and terminal fields instead of sending explicit `undefined`.
- Upgraded provider readiness to be abort-safe, offline-aware, stale-aware, and generation-safe like provider health.
- Centralized provider polling constants, bounded browser WebSocket reconnect/heartbeat timing, and deduplicated backend RPC/WebSocket/gRPC fallbacks.
- Kept `@powerchain/staking` fail-closed with no fabricated APR or deployment state.

### Strict TypeScript and install reliability

- Fixed `exactOptionalPropertyTypes` violations across Bridge and Swap by omitting undefined optional fields instead of passing them explicitly.
- Updated screen-reader status usage to the canonical children API, initialized React 19 `useRef` values, and hardened base-unit parsing under `noUncheckedIndexedAccess`.
- Root `postinstall` no longer requires `DATABASE_URL` during `pnpm install`; Prisma generation runs when configured and remains explicit after `pnpm env:bootstrap`.
- Added a server-only `POSTMAN_API_KEY` placeholder; personal Postman keys are never committed to release artifacts.

### Postman Flow architecture

- Added `docs/POSTMAN_FLOWS_ARCHITECTURE.md` with the PowerChain master flow plus Platform Preflight, Sui Swap, Solana/Jupiter Swap, and Bridge Create & Monitor visual architectures.
- Generated flow artifacts now use production-shaped request payloads and capture quote/order/transfer variables instead of placeholder `{}` bodies.
- Corrected the Bridge production Postman host to `https://bridge.powerchain.app`.
- Documented canonical Bridge statuses and the explicit external wallet-signing / Wormhole NTT settlement boundaries.

### Transaction/data UX refinement

- Added shared completion, confirmation, and message components for Swap/Bridge transaction surfaces.
- Added canonical slippage presets and persisted `useSlippageTolerance()`.
- Added durable `SwapExecution` and non-authoritative `WalletBalanceSnapshot` models with mirrored Prisma/Supabase migrations.
- Upgraded portfolio refresh/offline/staleness behavior and canonical RPC ownership.

### React types, callback typing, and token links

- Added root React/ReactDOM runtime and type dependencies so source-workspace compilation resolves `react` and `react-dom` types consistently under pnpm.
- Added explicit callback parameter types at direct-source UI boundaries that can otherwise surface `TS7006` implicit-`any` diagnostics when package inference is disrupted.
- Removed checked-in TypeScript incremental compiler state and now ignore `*.tsbuildinfo` to prevent machine-specific stale diagnostics.
- Added verified PowerChain product URLs to PWRC/wPWRC metadata plus a verified-only social-link schema; X, Discord, Telegram, and GitHub remain unset until official account URLs are supplied.
- Added `config/socials.json` and optional public social-link environment variables without fabricating social accounts.

### Postman specs, flows and mocks

- Added generated Postman specs, executable Collection Runner flow artifacts, and safe mock-server response examples.
- Added Platform Preflight, Sui Swap Review, Solana Swap Review, and Bridge Create & Monitor flows.
- Added mock examples that are explicitly non-authoritative for wallet signing, execution, finality, market truth, or Bridge accounting.
- Postman generation/check commands now keep docs, collections, specs, flows and mocks synchronized from canonical route actions.

- Added generated **PowerChain | DeFAI API Docs** under `api/postman/API_DOCS.md`, including production hosts, `X-Api-Key` authentication, transaction-safety boundaries, OpenAPI imports, and the canonical endpoint inventory generated from `shared/actions.json`.

- Fixed pnpm bootstrap on Node 26.x by relaxing the engine from a minor-pinned `>=24.18.1 <25` range to the supported `>=24 <25` LTS line.
- Changed `.nvmrc` and `.node-version` to `24`, added `pnpm env:bootstrap`, and made local setup create `.env` from a checked-in template without overwriting an existing environment.
- Expanded pnpm 11 `allowBuilds` for reviewed Prisma/native build dependencies required by the workspace, while keeping pnpm as the only supported package manager.

- Added production Postman domain variables for `https://powerchain.app`, `https://swap.powerchain.app`, and `https://bridge.powerchain.app`; the combined collection now routes Bridge and Swap requests through their dedicated hosts while shared APIs use the main PowerChain host.

### Runtime package and endpoint boundaries

- Added cluster-aware canonical Solana HTTP/WebSocket endpoint derivation, including explicit-only testnet/localnet behavior.
- Removed the Bridge-local Solana endpoint policy and routed provider health, public Bridge config, and Token-2022 inspection through `@powerchain/backend/services/rpc`.
- Added missing Next.js transpilation for `@powerchain/blockchain`, `@powerchain/clusters`, `@powerchain/chat`, and `@powerchain/staking`.
- Bridge configuration now uses the shared blockchain normalizer and cross-chain pair model.
- Added `runtime-packages:production:check` and runtime package-boundary documentation.

- Reorganized root release tooling under `api/`, moving Swagger and generated Postman artifacts into the API-contract workspace and renaming the collection to PowerChain DeFAI.
- Moved PWRC/wPWRC/provider metadata into `tokens/metadata/` and updated commitment/build-manifest references.
- Added canonical Sui Bridge target construction, source-level `config/sui-bridge.json`, fail-closed `0x0` Move source alias handling, and deployment/runtime target validation without fabricating package IDs.
- Added root-layout/Sui-target production checks, OpenAPI alias redirects, `.npmignore`/`.vercelignore`, and expanded package/workspace validation for the root API-contract package.

### Cross-chain blockchain and cluster foundation

- Added `/clusters` as the canonical Solana/Sui network registry for mainnet, testnet, devnet, and localnet contexts.
- Added `/shared/blockchain` for shared chain types, Solana/Sui address normalization, Sui coin-type normalization, and Solana↔Sui route-direction rules.
- Wired backend network config, Sui client selection, trusted tokens, wallet payer validation, Bridge quote addresses, RPC status, SDK clients, OpenAPI, and the Integrations UI to the shared foundation.
- Added browser-safe `/api/v1/blockchains` and `/api/v1/clusters`; neither exposes RPC credentials nor becomes settlement evidence.
- Kept Wormhole NTT as the sole PWRC/wPWRC cross-chain principal-movement protocol.

### Stablecoin, Pyth and RPC upgrade

- Added first-class Circle USDC on Solana and Sui plus EURC on Solana to the trusted token registry and swap selectors.
- Added canonical `services/currencies.ts` with currency metadata and Pyth feed configuration for SOL, SUI, PWRC, USDC and EURC.
- Added canonical `services/rpc.ts` for Solana JSON-RPC failover and Solana/Sui provider readiness; Bridge finality now reuses the shared Solana RPC client.
- Added `GET /api/v1/currencies` and `GET /api/v1/rpc/status`; both are informational and non-authoritative for Bridge accounting.
- Expanded Pyth-backed market prices and cross-rates to USDC and EURC without assuming a synthetic EURC peg when its feed is not configured.

### Product safety, consent and program hardening

- Added remembered cookie consent with a 180-day first-party choice and footer preference reset.
- Added Privacy, Terms, Cookie and DeFi/AI risk routes plus reusable toast/notices and section error boundaries.
- Added Vercel-only validated IP abuse context with pseudonymous rate-limit keys; generic forwarded headers remain untrusted.
- Hardened Solana/Sui auxiliary intent recording against empty destinations and all-zero quote digests without changing the Wormhole NTT principal-movement boundary.

### Backend transaction and operations refinement

- Centralized bridge-history status parsing, pagination, and persisted transfer queries in `apps/backend/src/services/transactions.ts`; the History page and history API no longer maintain duplicate Prisma query logic.
- Added canonical worker heartbeat lifecycle ownership under `apps/backend/src/workers/heartbeat.ts` and kept worker process apps as thin supervisors.
- Added `apps/backend/src/services/operations.ts` and `GET /api/v1/operations/status` for database readiness, worker freshness, and bounded Bridge/Claim/Fee queue snapshots.
- Added an abort-safe operational-readiness UI to Integrations with stale-snapshot disclosure and no secret endpoint or worker-ID exposure.
- Refined History into a DeFAI transaction workspace with page-local active/completed/attention summaries and consistent backend-owned status metadata.
- Updated OpenAPI/Swagger, Postman/API registries, backend architecture validation, documentation, and build-manifest bindings for the new service boundaries.

### Backend architecture and explorer UX

- Consolidated server ownership under `apps/backend`; root backend duplication is now forbidden.
- Moved Cetus/Jupiter/Raydium/Meteora/Orca adapters under `integrations/dex/`.
- Moved claim application service into the canonical backend package and updated API imports.
- Added shared backend explorer/transaction services and worker runtime configuration.
- Added a read-only `/explorer` workspace and navigation entry with explicit settlement-finality disclaimers.
- Added `backend:architecture:check` to prevent duplicate backend/DEX/claim implementations.

### PowerChain DeFAI product expansion

- Reframed the user-facing product from the historical bridge-only name to **PowerChain DeFAI** while retaining `apps/bridge` as a compatibility web shell in version 1.0.0.
- Added `apps/chat` with typed chat/messages/prompts, DeFi prompt catalog, saved prompts, chart models and suggestion UI.
- Added `/chat` as the default product entry point and a server-owned advisory assistant boundary that cannot sign or declare settlement.
- Added `apps/staking` and `/staking` with fail-closed Solana/Sui deployment configuration and no fabricated APR.
- Added the canonical `packages/protocol/src/ecosystem.ts` registry for AI Assistant, Swap, Bridge, Staking, Portfolio, Liquidity, Assets and Fees.
- Added `docs/DEFAI_ARCHITECTURE.md` and `docs/DEFAI_ECOSYSTEM.md` documenting AI, wallet, DEX, staking and Wormhole NTT authority boundaries.

- Added deterministic PWRC/wPWRC token-information commitment binding across `config/token.json`, token metadata, protocol asset registry, runtime readiness, SDK, OpenAPI/Swagger, auxiliary programs, documentation, and `build-manifest.json`.
- Added `@powerchain/sdk` with typed `PowerChainClient.tokenInformation()` plus `GET /api/v1/token/information`.
- Added separate Solana information-commitment PDA and Sui shared InformationCommitment object so the existing BridgeConfig layout is not silently changed.
- Added information-commitment and build-manifest production checks and runtime fail-closed verification of the canonical PWRC Solana mint and configured wPWRC Sui coin type.

### Release tooling, Postman, Vercel, and routing

- Pinned local runtime files to Node 26.x (latest LTS / Vercel Functions-compatible Node 26.x) and package-manager metadata to pnpm 11.22.0.
- Added a telemetry-disabled Next.js CLI wrapper used by dev, build, and start commands.
- Added generated Postman collection/environment artifacts sourced from the canonical API action registry while keeping OpenAPI/Swagger as the schema-rich contract.
- Added route-contract and release-tooling production gates for API registry drift, redirects, Node/pnpm pins, Vercel config, Postman artifacts, and telemetry policy.
- Added canonical Next.js redirects for legacy `/home`, `/app`, `/trade`, `/transactions`, and API discovery paths.
- Kept Vercel routing minimal so Next.js remains the single routing/header authority.
- Documented pnpm `allowBuilds` review policy and the requirement to generate a real `pnpm-lock.yaml` before claiming deterministic frozen-lockfile builds.

### Provider SDK and API organization

- Added typed CoinMarketCap, Birdeye, DEX Screener, Helius, Metaplex and Tensor adapters alongside Jupiter, Raydium, Meteora, Orca and Cetus.
- Added centralized Solana/Sui endpoint pools, fallback definitions, safe actions, caching, formatting, rate limiting, payment/onramp readiness and Solana Pay utilities.
- Added local-first PowerChain token artwork, branded Web3 Icons for common assets, and an opt-in licensed cryptoicons.cc template without inventing a public API.
- Added OpenAPI JSON, `api/swagger.yaml`, generated `shared/actions.json`, metadata/token documentation, transaction preferences, routing information and workspace settings.
- Market-data APIs remain non-authoritative for bridge accounting; Wormhole NTT remains the sole cross-chain principal-movement protocol.

### Multichain swap, pools and portfolio

- Added Solana + Sui swap network selection with Jupiter Swap V2 and Cetus execution boundaries.
- Added trusted token registry and reusable token selectors.
- Added Raydium, Meteora, Orca and Cetus pool discovery with normalized pool data.
- Added connected-wallet trusted-asset portfolio and `usePortfolio` / `usePools` hooks.
- Added DEX pool, swap-route and liquidity-position database schema/migrations.
- Added best-effort pool/route analytics persistence without making analytics authoritative for execution or bridge settlement.
- Added Solana liquidity-position summaries from Raydium Owner API and Meteora portfolio data.

- Added server-backed Swap source-balance preflight, exact Max for non-gas Sui assets, explicit SUI gas-reserve protection, and a wallet-review preflight checklist before signature.

### Swap, transaction fees, and wallet safety

- Added a unified `Swap / Bridge` transaction workspace and dedicated `/swap` route.
- Added Cetus Aggregator swap quoting and unsigned Sui transaction construction.
- Added gear-based swap settings with 0.01%–5% slippage tolerance and MEV-aware minimum-output protection.
- Added a configured 2.5% Cetus overlay fee for Sui swaps.
- Added PWRC Token-2022 250 bps transfer-fee configuration verification plus standard withheld-fee harvest/withdraw planning.
- Added treasury/fee receiver and withdraw-authority configuration without exposing signing secrets.
- Added `payer.ts` guards that bind transaction preparation to the connected wallet.
- Enforced user-paid network fees, no sponsored gas, and wallet-owned signatures.
- Added server-side re-quote protection so a prepared swap cannot fall below the minimum output displayed to the user.

### Application and UI/UX

- Reworked the visual system to remove emerald/bright-green accents in favor of white, light gray, dark forest green, onyx, and black.
- Made the light theme the first-visit default while preserving the persisted dark-theme toggle.
- Added restrained vertical cinematic gradients, white/light-gray button variants, and controlled glassmorphism through named shell/hero primitives.
- Kept operational forms, warnings, status evidence, and mobile action bars readable and non-translucent where blur would reduce clarity.
- Fixed persisted theme bootstrapping so a saved light/dark choice is applied before hydration, avoiding reload flashes and preserving the user-selected mode across tabs.
- Added an accessible mobile navigation drawer so Claim, Fees, and Integrations remain discoverable beyond the five-item bottom navigation.
- Removed remaining navy/blue and emerald interaction styling in favor of onyx, slate, white/light gray, and dark forest-green states.
- Added root application loading/error boundaries and an installable standalone web-app manifest using the PowerChain application icon.
- Rebuilt the production app shell around the supplied PowerChain design references: solid dark desktop sidebar, light settlement workspace, compact mobile header, and safe-area mobile bottom navigation.
- Added canonical local PowerChain logo variants plus optimized PWRC/wPWRC artwork and an App Router application icon.
- Restyled the NTT transfer surface as the primary dark bridge card with explicit Sui wPWRC → Solana PWRC route context while keeping the embedded Wormhole flow authoritative.
- Added a live Solana/Sui settlement overview backed by provider health, finalized heads, latency, transport, and configured endpoint availability instead of synthetic network statistics.
- Added a database-backed recent-transfers surface with resilient loading, empty, and unavailable states.
- Upgraded the light-first shell with restrained cinematic gradients and controlled glassmorphism while keeping transaction evidence and action surfaces legible.
- Reordered the primary Bridge page so the Wormhole NTT transfer action appears before secondary diagnostics.
- Added active navigation state, keyboard skip navigation, compact mobile wallet controls, and reduced-motion support.
- Added focus trapping, Escape/backdrop close, focus restoration, and scroll locking to the wallet chooser.
- Added route-level loading and recoverable error states for Bridge, History, Claim, Wallet, and Integrations.
- Added responsive History cards, result counts, validated status filters, and one-action filter clearing.
- Added a shared application footer and safe 404 recovery page without wallet side effects.
- Reworked Integrations with provider-state badges and explicit Wormhole NTT-only principal-movement disclosure.
- Removed duplicate inner gutters from Assets and Fees for consistent responsive spacing.
- Hardened live-chain response rendering by narrowing unknown API data before property access.
- Improved Wormhole Connect loading and configuration-error presentation.

### Bridge, claims, fees, and recovery

- Made Sui wPWRC → Solana PWRC the default bridge direction while retaining the reverse PWRC → wPWRC route.
- Added public bridge config/routes APIs plus persisted event snapshots and an SSE stream fallback.
- Added transactional bridge audit events for creation, submission, finality, NTT observation, reconciliation, completion, and retry scheduling.
- Added DB-backed bridge quote/transfer intent, idempotency, runtime safety gates, status/history APIs, and real finality/reconciliation paths.
- Added finalized Solana/Sui source and destination verification plus Wormhole NTT correlation.
- Added bridge worker leases/retries and exact principal reconciliation with fee-gated completion.
- Added server-authoritative trusted-wallet claim challenge, reservation, payout, submission, and finality verification.
- Added governance-controlled service-fee policy, source-chain fee verification, revenue reconciliation, and fee worker processing.
- Standardized browser recovery metadata on `powerchain.operation-journal` without storing secrets or authorization proofs.
- Added bounded database retries for serialization/deadlock conflicts and separated claim reserve/submit idempotency.
- Made migration mirrors byte-identical and fail-closed under validation.

### Protocol and chain integrations

- Expanded the Solana auxiliary `BridgeConfig` with pause state, versioning, monotonic operation nonces, and governed pause updates.
- Added the Sui shared `BridgeConfig` authority/pause/version/nonce model with 32-byte quote-commitment binding.
- Moved blocking Sui bridge-runtime, balance, integrity, finality, and fee-verification reads to the current Sui gRPC/Core API path with ordered fallbacks.
- Configured the auxiliary Solana Bridge Anchor program ID as `BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS`.
- Added a `BridgeConfig` PDA with initialized signer authority, authority rotation, explicit unauthorized-signer rejection, and authority-change audit events.
- Added separate `POWERCHAIN_SOLANA_BRIDGE_AUTHORITY` configuration so the executable program account cannot be misused as the signer authority.
- Added Solana/Sui provider pools, readiness/diagnostic boundaries, and realtime fallbacks.
- Added Token-2022 asset integrity, supply, authority, extension, and freshness checks.
- Added the `@powerchain/protocol` package for canonical validation, signatures, transaction IDs, fees, explorers, and integration registry.
- Added auxiliary Solana Anchor and Sui Move intent/audit programs without replacing Wormhole NTT.
- Migrated Sui backend verification to current Sui SDK gRPC/Core API boundaries.
- Added Wallet Standard Solana and Mysten Sui dApp Kit wallet integration.
- Added browser-safe integration enablement for supported liquidity/data providers while keeping bridge settlement authority server-side.

### Runtime and operations

- Added ordered CSV fallback pools for Solana HTTP RPC, Solana WebSocket, Sui gRPC, and application realtime WebSocket endpoints.
- Added WebSocket reconnect endpoint rotation with SSE and cursor-based polling fallback over the same persisted audit state.
- Hardened worker ticks with bounded timeouts, cooperative shutdown, bounded jittered retry/backoff, and timer cleanup.
- Added worker readiness/freshness reporting and stronger runtime environment validation.
- Added explicit Prisma PostgreSQL driver-adapter pool configuration.
- Added canonical health, readiness, and version endpoints.
- Added database readiness and graceful Prisma disconnect handling.
- Hardened Next.js response headers, server externals, standalone tracing, cleanup targets, and Vercel build boundaries.

### Workspace and build hardening

- Pinned pnpm to `11.22.0` and added pnpm-only package-manager recovery tooling.
- Kept the supported Node runtime range at `>=24 <25` with local Node pinned through `.nvmrc`/`.node-version`.
- Removed deprecated TypeScript `baseUrl` usage and kept explicit path mappings.
- Added explicit Node/React ambient types and strict transaction/raw-query typing.
- Fixed worker TypeScript config inheritance and backend ESM import boundaries.
- Added Prisma 7 generation/validation requirements and dependency-aware build gates.
- Added workspace checks for versions, imports, environment templates, worker policy, protocol layout, placeholder deployment IDs, and migration parity.
- Removed runtime `.env`, `.env.local`, and `.env.production` files from release artifacts and added validation preventing them from being packaged.

### Documentation and validation

- Reworked the root README into a concise architecture/setup/release entry point.
- Added a canonical `docs/README.md` documentation index.
- Cleaned scoped READMEs so they describe ownership rather than duplicating root documentation.
- Normalized this changelog under the single `1.0.0` release hierarchy.
- Added Markdown auto-fix and enforced MD012, MD022, and MD032.
- Added source-only production checks plus a separate dependency-aware validation gate for Prisma, TypeScript, and Next.js builds.
- Added focused documentation for NTT execution, bridge authority/operations, endpoint/realtime fallback topology, failure safety, operations, UI/UX, workspace recovery, TypeScript/build fixes, and validation evidence.

### UI/UX refinement — provider truthfulness and transfer ergonomics

- Removed the remaining `as never` escape from Wormhole NTT route construction and now infer the route-constructor argument type directly.
- Added explicit provider refresh state so first-load and background refresh UX are distinct, duplicate refresh clicks are blocked, and refresh state is announced accessibly.
- Changed Sui redundancy reporting to probe every configured gRPC endpoint and derive full/reduced redundancy from endpoints that actually respond rather than from URL count alone.
- Updated the settlement overview to report healthy endpoints instead of implying that every configured endpoint is reachable.
- Moved the sticky active-transfer banner below the mobile sticky header and normalized remaining bridge error accents to the rose error system.

### UI/UX refinement — navigation and operation freshness

- Replaced text-glyph navigation markers with a consistent accessible SVG icon system across the desktop sidebar, mobile drawer, and bottom navigation.
- Added a stronger active state to mobile primary navigation while preserving safe-area behavior.
- Hardened Recent Transfers refresh behavior with request cancellation, retry handling, periodic visible-tab refresh, relative timestamps, and stale-snapshot disclosure when a refresh fails.
- Added provider-health freshness text so operational badges communicate when the runtime state was last checked.
- Normalized remaining Bridge route accents to the onyx/forest visual system and extended footer navigation to Claim.

### UI/UX refinement — endpoint diagnostics and offline resilience

- Hardened Solana/Sui redundancy semantics so only healthy, closed-circuit endpoints count as available fallback capacity.
- Fixed failed Sui readiness probes so configured endpoint count can no longer be reported as live redundancy evidence.
- Added compact endpoint diagnostics and full/reduced/unavailable fallback-readiness labels to the network settlement overview without exposing endpoint URLs.
- Added browser offline awareness to provider-health refresh behavior and retained the last successful provider snapshot while offline.
- Strengthened runtime validation for nested provider endpoint health objects before they reach React.
- Replaced the mobile sticky action bar blur surface with a solid light/onyx surface for clearer contrast and consistency with the production shell.
- Routed active-transfer status navigation through Next.js client navigation while preserving resumable-transfer state.

### Data and persisted metrics refinement

- Added selectable 24-hour, 7-day, and 30-day persisted metrics windows with abort-safe, timeout-bounded, offline-aware refresh behavior.
- Added selected-window route-direction counts for wPWRC → PWRC and PWRC → wPWRC plus completed-principal totals.
- Added persisted lifecycle timing for source finality, Wormhole NTT observation, destination finality, and completed operation duration without estimated timing data.
- Added strict `windowHours` API validation with a fail-closed `400 BRIDGE_METRICS_WINDOW_INVALID` response for malformed or out-of-range windows.
- Added `bridge_transfers(created_at)` and `bridge_transfers(direction, created_at)` indexes with byte-identical Prisma/Supabase migration mirrors for bounded metrics-query performance.
- Added canonical `apps/bridge/lib/data/data.ts` for bridge directions, transfer statuses, labels, and metrics payload validation.
- Added server-only `apps/bridge/server/services/metrics.ts` backed exclusively by persisted `BridgeTransfer` records.
- Added `GET /api/v1/metrics/bridge` with no-store/fail-closed behavior.
- Added a Bridge metrics surface for persisted transfer counts, terminal completion ratio, principal totals, reconciliation state, and sampled operation timing.
- Metrics remain operational summaries only and are never treated as bridge accounting or settlement evidence.
- Updated the data production gate from stale Sui JSON-RPC assertions to the current Sui gRPC/Core runtime boundary.

### Cinematic transaction review refinement

- Reworked the Swap / Bridge selector into a full-width cinematic segmented control with mode-specific safeguards and clearer transaction context.
- Added a true two-step swap confirmation boundary so `Review & swap` no longer constructs a transaction until the user has reviewed amount, minimum received, route, slippage, fee, payer/signature ownership, and gas responsibility.
- Added an accessible modal review sheet with Escape/backdrop dismissal, scroll locking, quote-expiry enforcement, and explicit `Confirm & open wallet` handoff.
- Surfaced Cetus aggregator route deviation only when supplied by the live quote, with neutral/amber/rose severity treatment instead of synthetic price-impact claims.
- Added transaction-request cancellation on component cleanup so an abandoned swap screen cannot continue a stale transaction-build request.

### Swap quote and fee UX refinement

- Added abort-safe swap quote refresh so stale responses cannot replace newer routes.
- Added visible quote expiry countdown and explicit refresh-before-signing behavior.
- Added clearer wallet-rejection, payer-change, route-unavailable, and price-protection messages.
- Added protected/standard route state to the swap review surface.
- Separated Sui swap-fee disclosure from Solana PWRC Token-2022 verification so unrelated mint status does not appear as a swap blocker.
- Added outside-click dismissal for the swap settings panel.

### Bridge / Swap API separation

- Separated Bridge and Swap router policies, OpenAPI contracts, Postman collections and SDK clients while retaining shared security/RPC/currency infrastructure.
- Added `/api/v1/bridge/openapi` and `/api/v1/swap/openapi`, plus root `api/bridge/` and `api/swap/` contract packages.
- Added `client.bridge` and `client.swap` SDK domains and production regression checks preventing cross-domain route ownership.

### API key security

The OpenAPI contracts define `X-Api-Key` through the global `ApiKey` security scheme. Runtime enforcement is controlled by `POWERCHAIN_API_KEY_MODE=off|optional|required`; accepted server-only keys are configured through `POWERCHAIN_API_KEYS`. Local and production templates are provided as `.env.local.example` and `.env.production.example`. Never expose API keys through `NEXT_PUBLIC_*`.

### Swap core and execution logic

- Added `@powerchain/swap-core` 1.0.0 as the provider-neutral swap contract.
- Centralized base-unit validation, slippage bounds, 2.5% fee math, quote freshness, minimum-output protection, payer/asset normalization, and swap state transitions.
- Jupiter and Cetus execution adapters now consume the shared canonical intent rather than maintaining separate amount/slippage rules.
- Browser Swap helpers and SDK request types now consume Swap Core, and Next transpiles the source workspace explicitly.

## 2026-08-16 — hooks, wallet SSR, staking, escrow and monorepo resilience

- Fixed zero-argument provider-health/readiness hooks and exact-optional operation-journal clear messages.
- Added typed provider endpoints/client/config/context/error boundaries with timeout, cancellation and fail-closed readiness behavior.
- Preserved WebSocket → SSE → polling fallback with bounded reconnect behavior and no synthetic chain events.
- Isolated Mysten Sui wallet runtime/UI into `ssr: false` browser islands to prevent Next.js `window` / `document` server-evaluation failures.
- Added optional Reown WalletConnect Solana adapter while retaining Wallet Standard discovery.
- Upgraded Next.js to 16.3.1 and hardened root Vercel/pnpm/Node 24 configuration.
- Made `env:bootstrap` repository-root aware and restored root environment templates; postinstall skips Prisma generation when `DATABASE_URL` is absent.
- Added deployment/RPC-gated fixed-pool PWRC staking verification and `types/staking.ts` boundaries without fabricated APR/APY or reward amounts.
- Added the deployment-gated `powerchain_escrow` Anchor program, receipt PDAs, mint allowlisting, timelocks, Token-2022 extension policy and four custom hook points.
- Added non-custodial Solana Pay / escrow checkout planning and escrow readiness API endpoints.
- Added escrow and staking source-level regression gates and updated generated API/Postman contracts.

### Canonical PWRC policy hardening

- Canonical supply is `18,446,000,000 PWRC` (`18,446,000,000,000,000,000` base units at 9 decimals).
- Canonical PWRC does **not** use Token-2022 `TransferFeeConfig`; native transfer-fee policy is `0` bps.
- PowerChain service fees remain governed and settled separately from bridge principal and network gas.
- `pnpm token-policy:production:check` prevents mint, decimals, supply, or transfer-fee policy drift.
- `pnpm workspace:bootstrap` now verifies that no dependency build scripts remain ignored after installation.

### Prisma install/build hardening

Prisma Client generation no longer requires `DATABASE_URL`. `prisma.config.ts` uses the optional environment value so `prisma generate` can run during install, typecheck, and build; database/migration commands still require a real configured URL. Root postinstall resolves the installed local Prisma CLI directly and generates the client without nested package-manager execution. Production build/typecheck no longer create `.env` files as a side effect.

- Staking transaction recovery now persists wallet-submitted signatures locally, synchronizes them across tabs, reconciles Solana confirmation state through RPC, and never auto-retries an ambiguous staking instruction.

## 2026-08-17 — monorepo routing and redirect hardening

- Added a canonical application route/redirect registry consumed by Next.js and shared navigation.
- Added a real `/status` page for provider health, redundancy and fail-closed execution readiness.
- Added compatibility redirects for dashboard/staking/rewards/validators/history/portfolio/docs aliases without redirect loops.
- Consolidated sidebar, primary, mobile-drawer, mobile-bottom and footer navigation around one route definition set.
- Expanded backend core routing for provider, staking, escrow, payment and wallet APIs.
- Added parameter-aware backend route matching and encoded path traversal rejection.
- Added frontend/backend routing production gates and routing documentation.
- Hardened monorepo routing runtime with bounded dynamic route builders, single-hop redirect validation, primary route loading boundaries, global error recovery, robots metadata, and canonical claim result navigation.

## Routing observability hardening — 2026-08-17

- Added static critical-route identity, risk, rate-class, and Server-Timing response labels without exposing dynamic route values.
- Added parameter-aware core route matching and registered-path method discovery.
- Added shared `RecoveryActions` backed by `APP_ROUTES`; removed the remaining hard-coded Bridge history recovery link.
- Added route-observability documentation and production validation.

## Route policy and limiter hardening — 2026-08-17

- Centralized lightweight feature/rate enforcement for registered critical routes at the Next.js proxy boundary.
- Added `405 Method Not Allowed` + `Allow` handling for registered paths with unsupported methods.
- Added request-ID preservation and rate-limit metadata to proxy-generated failures.
- Prevented route handlers from double-consuming rate buckets after proxy enforcement while preserving direct invocation safety.
- Replaced the unbounded process-local rate-limit map with a configurable bounded/pruned store.
- Documented the local limiter as best-effort instance protection rather than distributed quota, billing, settlement, or abuse-accounting authority.

- Added sanitized process-local route-policy diagnostics with limiter pressure, typed client/hook wiring, and Runtime Status visibility; no client or wallet identifiers are exposed.

## Production readiness hardening — 2026-08-17

- Added aggregate `/api/v1/system/readiness` with explicit read/new-operation/async-settlement capabilities.
- Added abortable client polling and Runtime Status production-readiness UI.
- Added `deploy:preflight` and non-custodial `deploy:smoke` commands.
- Added production-readiness source validation and documentation.

### Runtime topology and worker-readiness hardening

- Corrected system readiness so required worker kinds are not incorrectly counted as observed when heartbeat rows are missing.
- Added shared `WORKER_KINDS` / `REQUIRED_WORKER_KINDS` topology and explicit observed, ready, missing, and stale worker evidence.
- Removed `@powerchain/backend` from `dev:stack`; it is a business-logic library, not a standalone daemon.
- Converted backend `dev` into TypeScript watch mode and moved worker `tsx`/`typescript` tooling to development dependencies.
- Added service-topology documentation and a production regression gate.

## Worker retry and queue-age hardening — 2026-08-17

- Stopped automatic reclaim of `RECONCILIATION_REQUIRED` bridge transfers.
- Added bounded bridge retry attempts and manual-reconciliation escalation.
- Added oldest-pending queue age to operational pressure/readiness.
- Added queue-age and bridge retry environment controls plus production gate.

## Worker drain quiescence hardening — 2026-08-17

- Added worker drain quiescence evidence (active leases) and a sanitized authenticated operator attention queue.

## Operator maintenance workflow hardening — 2026-08-17

- Added fail-closed drain-wait tooling that requires database-backed zero active leases plus quiescence.
- Added post-maintenance resume verification for drain-off, database/provider/worker readiness, new operations, and async settlement.
- Added server/CLI-only operator attention inspection with bounded queue filtering and timestamp pagination.
- Corrected the blocked system-readiness fallback so it always satisfies the strict maintenance payload contract and never claims quiescence without database evidence.

### Runtime maintenance control

- Added persisted, audited, revision-checked worker drain/resume state.
- Workers dynamically consume maintenance state and fail closed when it is unavailable.
- Preserved `POWERCHAIN_WORKER_DRAIN_MODE` as a one-way emergency override.
- Added authenticated operator maintenance API and CLI.

### Runtime maintenance freshness hardening

- Added bounded persisted-maintenance reads with `POWERCHAIN_WORKER_MAINTENANCE_TIMEOUT_MS`.
- Maintenance database timeout/failure now remains fail-closed while preserving source/revision/read-health diagnostics.
- System and operations readiness distinguish operator drain, environment override, and maintenance-store failure.
- Blocked readiness fallbacks now carry the full maintenance control-plane contract.
- Repeated identical drain/resume mutations are idempotent no-ops instead of creating meaningless revisions.
- Added a dedicated runtime-maintenance freshness production gate and validation documentation.

### Programs, contracts and protocol UI

- Added the light-first `/protocol` workspace and runtime program-readiness API.
- Added source-controlled program inventory in `@powerchain/protocol/programs`.
- Wired Solana Bridge, Staking, Escrow and Sui Bridge runtime evidence without promoting configured identifiers as deployed truth.
- Added bridge config-version enforcement to privileged Solana and Sui guard operations.
- Added canonical `/programs` and `/contracts` redirects to `/protocol`.

- Tightened Protocol readiness so both core Bridge Guard deployments must be fresh, executable and RPC-verified; optional staking/escrow source presence cannot make core readiness green.
- Strengthened Sui Bridge runtime evidence with package/object Move-type validation in addition to object-ID matching.

### Program runtime freshness hardening — 2026-08-17

- Added bounded per-program verifier deadlines with explicit timeout evidence.
- Added client-side evidence freshness aging and core bridge stale-state warnings.
- Added Protocol UI timeout/stale badges and production validation coverage.

### Program runtime evidence cache — 2026-08-17

- Added bounded server-side program evidence caching and in-flight verifier coalescing.
- Manual Protocol verification now forces fresh evidence while background refreshes remain cache-eligible.
- Program runtime payloads expose live/cache provenance and cache age without changing settlement authority.

## 1.0.0 — Protocol verifier cancellation and cache invalidation — 2026-08-17

- Propagated verifier deadline cancellation into Solana/Sui, staking, and escrow runtime verification.
- Bound process-local program evidence cache entries to deployment-configuration fingerprints.
- Prevented stale in-flight verification results from repopulating cache after configuration changes.
- Added production validation and documentation for the new invariants.

### Program deployment evidence hardening — 2026-08-17

- Solana Bridge runtime readiness now requires executable-account ownership by a recognized Solana program loader, including Loader v4 support.
- Sui Bridge runtime readiness now verifies BridgeConfig and InformationCommitment are shared objects as required by the Move source lifecycle.
- Added strict typed deployment-evidence payloads and Protocol UI diagnostics for loader/shared-object evidence.
- Added production validation and release-manifest coverage for these invariants.

## Swap dependency surface hardening — 2026-08-17

- Added pinned Axios, bs58 and `@jup-ag/api` dependencies to the `/swap` application workspace.
- Added pinned Anchor, Solana Kit, SPL Token/SPL Token Metadata, node-fetch, uuid, ws and Zod dependencies at the private monorepo root.
- Kept `node:fs` as the Node 24 built-in instead of installing an npm `fs` package.
- Added a production gate that prevents dependency-surface drift or use of the incorrect `@solana/token-metadata` package name.

### Cloudflare and application integration hardening

- Added Cloudflare Workers production target through `@opennextjs/cloudflare` and Wrangler while preserving standalone Node deployment.
- Added workerd preview/upload/deploy commands, compatibility configuration, static asset caching, observability, and a production gate.
- Reworked the Integrations UI into application surfaces, edge runtime, operational readiness, diagnostics, and provider catalog sections.
- Added shared responsive form-control primitives and improved provider cards for clearer mobile/desktop hierarchy.

### Production CI and repository normalization

- Added a least-privilege GitHub Actions production workflow for Node 24 and pinned pnpm 11.22.0.
- Added a source-controlled CI production gate that forbids npm/Yarn/Bun installs and requires frozen pnpm installs.
- CI now fails closed when the reviewed `pnpm-lock.yaml` is missing rather than silently regenerating dependencies.
- Added `.editorconfig`, `.gitattributes`, and `.dockerignore` for deterministic line endings, generated-artifact handling, and smaller deployment contexts.

### User settings, custom RPC/API and generated SDK client — 2026-08-17

- Added browser-local user profile and versioned application settings for PowerChain API, Solana RPC, Sui gRPC, swap and bridge preferences.
- Added session-only PowerChain and Jupiter API credentials; secrets are excluded from local settings exports and persistent local storage.
- Added custom PowerChain API routing with explicit production CORS origin allowlisting.
- Added user-supplied Jupiter Swap V2 credentials and custom-host protection that never forwards the server Jupiter key to user-selected hosts.
- Added custom Solana/Sui wallet endpoint wiring, endpoint diagnostics and safe fallback to canonical endpoints.
- Added saved bridge direction/polling/realtime preferences and saved swap network/slippage/routing preferences.
- Extended the API registry generator to emit a typed SDK route registry and added a generic generated API client.
- Extended `PowerChainClient` with shared dynamic headers and explicit Jupiter override helpers for Solana swap order/execute calls.
- Added `user-settings:production:check` and production validation for CORS origins/Jupiter host allowlists.
- Added endpoint-bound session credential clearing so PowerChain/Jupiter keys cannot silently follow a changed host.
- Upgraded Sui custom-endpoint diagnostics to use the same `SuiGrpcClient` transport and Core API chain-identifier probe used by the application runtime.
- Added generated dynamic-path construction with encoded required route parameters and strengthened custom Jupiter SSRF protections against local/IP-literal production targets.
- Added a sanitized `/api/v1/swap/solana/provider` policy-validation endpoint plus Settings and SDK helpers so user Jupiter host/key configuration can be checked before requesting a quote or transaction.
- Moved transient Jupiter override parsing into one server helper shared by provider/order/execute routes and documented the override headers in the Swap OpenAPI contract.

## 2026-08-17 — Dev Container hardening

- Added `.devcontainer/devcontainer.json` and Compose override with a dedicated Node 24 workspace service.
- VS Code no longer attaches to the PostgreSQL container.
- Devcontainer PostgreSQL runs on the internal Compose network; the base `5432` host publication is reset in the override.
- Added host-side generation of an ignored, mode-0600 local database credential without printing the secret.
- Added deterministic post-create pnpm/Prisma/workspace setup without automatic migrations.
- Added explicit devcontainer-aware local database lifecycle behavior and a production regression check.

### Toolchain bootstrap hotfix

- Fixed zero-assumption bootstrap ordering so the downloaded Node 26.7.0 `bin/` directory is exported before npm is invoked to install pnpm.
- Fixed sourced bootstrap failure propagation; a failed Node validation no longer falls through into pnpm installation.
- Partial/stale user-local Node installations are now removed and reinstalled after a failed executable/version self-check.
- Added an offline bootstrap self-test that starts with no visible node/npm/pnpm and verifies Node is available before npm runs.

## 2026-08-17 — Marketing frontend, dashboard shell, and runtime-boundary fix

- Added `apps/web` as a modular marketing Next.js frontend on port 3001.
- Added professional marketing header, hero, products, features, partnerships, FAQ, CTA, logo, footer and shell modules.
- Made `/dashboard` the canonical application entry route and upgraded the command-center dashboard hierarchy.
- Added collapsible dashboard navigation and fixed viewport scroll ownership; only page content and overflowing sidebar navigation scroll.
- Kept dashboard footer navigation-free and separate from workspace content.
- Added richer AI chat identity, assistant/user avatars, suggestion cards and a dedicated `components/chat/chat-interface.tsx`.
- Removed Next.js `server-only` markers from the shared backend runtime package so direct Node/tsx workers can execute backend modules.
- Routed browser-safe explorer URL helpers through `@powerchain/protocol/explorers` and added a client/backend boundary production check.

### Operational read reliability

- Removed a portfolio refresh identity loop by decoupling the refresh callback from fetched portfolio state.
- Added offline-aware abort handling and normalized public error codes for portfolio, pool, liquidity, and PWRC integrity reads.
- Added explicit freshness tracking for portfolio and asset-integrity snapshots.
- Restored canonical `bridgeStatusRoute()` construction in the Recent Transfers card.
- Standardized bridge recovery, network settlement, asset-integrity, and mobile review actions on shared Card/Button/Badge primitives.
- Replaced text-only Solana/Sui network markers in settlement health with branded network icons.
- Prevented Swap error fallbacks from reflecting arbitrary provider/browser exception text.
- Added `operational-read-hooks:production:check` to the production verification chain.
