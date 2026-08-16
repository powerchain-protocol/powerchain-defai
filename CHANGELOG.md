
# Changelog

All notable changes to PowerChain DeFAI are documented here. The project remains at version **1.0.0**.

- Added canonical backend routing policy, request-security helpers, validated price/rate services, exact base-unit calculators, and versioned rates/calculator/security APIs; market data remains non-authoritative for Bridge accounting.

- Added typed provider/feature configuration for official Solana programs, Jupiter/Raydium compatibility endpoints, CoinGecko, Pyth aliases, Sui compatibility settings, cross-chain provider flags, S3 readiness, AI providers, notifications, bounded cache TTLs, WebSocket policy, and feature gates.
- Added CoinGecko market-data integration, Resend mail fallback, runtime Swap/Bridge feature enforcement, and canonical official Solana program validation.
- `SWAGGER_API_KEY` is supported only as a server-side compatibility alias for `X-Api-Key`; the user-supplied key is intentionally not stored in source and should be rotated because it was shared in chat.

### Monorepo, contracts and programs

- Added `@powerchain/bridge-core` for canonical bridge intent validation and direction codes.
- Refactored Solana and Sui intent guards into reusable program functions.
- Added version-2 observability events with chain context while preserving existing config layouts.
- Hardened information-commitment version checks and kept Wormhole NTT as the sole principal movement protocol.

## 1.0.0

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

- Fixed pnpm bootstrap on Node 24.x by relaxing the engine from a minor-pinned `>=24.18.1 <25` range to the supported `>=24 <25` LTS line.
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

- Pinned local runtime files to Node 24.x (latest LTS / Vercel Functions-compatible Node 24.x) and package-manager metadata to pnpm 11.22.0.
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
