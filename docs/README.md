# PowerChain DeFAI Documentation

This directory is the technical documentation index for **PowerChain DeFAI 1.0.0**. The root [`README.md`](../README.md) is the onboarding entry point; this index points to the detailed architecture, execution, operations, security, UI/UX, and release material.

## Start here

- [`DEFAI_ARCHITECTURE.md`](DEFAI_ARCHITECTURE.md) — product architecture and AI/wallet execution boundary.
- [`DEFAI_ECOSYSTEM.md`](DEFAI_ECOSYSTEM.md) — canonical module/authority registry.
- [`STAKING.md`](STAKING.md) — verified staking identifiers, fixed reward-pool policy, Solana program, and deployment gates.
- [`REAL_NTT_BRIDGE.md`](REAL_NTT_BRIDGE.md) — Wormhole NTT lifecycle and settlement boundary.
- [`BRIDGE_SWAP_API_SEPARATION.md`](BRIDGE_SWAP_API_SEPARATION.md) — independent Bridge/Swap API contracts and SDKs.
- [`VALIDATION.md`](VALIDATION.md) — release gates and validation status.

## Bridge and protocol

- [`BRIDGE_OPERATIONS.md`](BRIDGE_OPERATIONS.md) — default route, operation lifecycle, APIs, realtime fallbacks, and reconciliation.
- [`BRIDGE_AUTHORITY.md`](BRIDGE_AUTHORITY.md) — Solana/Sui auxiliary authority, pause, nonce, and commitment controls.
- [`TOKEN_INFORMATION_COMMITMENT.md`](TOKEN_INFORMATION_COMMITMENT.md) — deterministic PWRC/wPWRC information binding.
- [`CROSS_CHAIN_CLUSTERS.md`](CROSS_CHAIN_CLUSTERS.md) — canonical Solana/Sui chains, clusters, addresses, and route definitions.
- [`STABLECOINS_PYTH_RPC.md`](STABLECOINS_PYTH_RPC.md) — USDC/EURC, Pyth feeds, and canonical RPC ownership.

## Swap, liquidity, data, and integrations

- [`SWAP_AND_FEES.md`](SWAP_AND_FEES.md) — Swap/Bridge transaction surface, fee policy, payer/signature safety.
- [`DEX_SWAP_LIQUIDITY.md`](DEX_SWAP_LIQUIDITY.md) — Jupiter, Cetus, Raydium, Meteora, Orca, pools, liquidity, and portfolio.
- [`DATA_METRICS.md`](DATA_METRICS.md) — persisted metrics and accounting-authority limits.
- [`INTEGRATIONS_ARCHITECTURE.md`](INTEGRATIONS_ARCHITECTURE.md) — provider SDK and integration ownership.
- [`ROUTING_SECURITY_DATA_SERVICES.md`](ROUTING_SECURITY_DATA_SERVICES.md) — router policy, request security, calculators, prices, and rates.

## Backend and operations

- [`BACKEND_OPERATIONS.md`](BACKEND_OPERATIONS.md) — canonical backend ownership, transaction service, workers, and operational readiness.
- [`OPERATOR_MAINTENANCE_WORKFLOW.md`](OPERATOR_MAINTENANCE_WORKFLOW.md) — drain-wait, sanitized operator attention, and safe resume verification.
- [`OPERATIONS_HARDENING.md`](OPERATIONS_HARDENING.md) — worker/runtime safeguards.
- [`FAILURE_SAFETY.md`](FAILURE_SAFETY.md) — idempotency, recovery, database contention, and failure handling.
- [`PLATFORM_HARDENING.md`](PLATFORM_HARDENING.md) — platform/runtime production boundaries.
- [`RUNTIME_PACKAGE_BOUNDARIES.md`](RUNTIME_PACKAGE_BOUNDARIES.md) — Next workspace transpilation and shared runtime ownership.
- [`HOOKS_RUNTIME_RESILIENCE.md`](HOOKS_RUNTIME_RESILIENCE.md) — React 19 hooks, exact optional types, provider refresh, realtime fallbacks, and operation-journal safety.

## UI/UX, safety, and legal

- [`UI_UX_REFINEMENT.md`](UI_UX_REFINEMENT.md) — cinematic light/dark design and transaction-flow UX.
- [`PRODUCT_SAFETY_LEGAL.md`](PRODUCT_SAFETY_LEGAL.md) — cookie consent, legal surfaces, IP abuse prevention, error boundaries, and program guards.

## Workspace, API, and release tooling

- [`WORKSPACE.md`](WORKSPACE.md) — monorepo conventions and workspace commands.
- [`API.md`](API.md) — API contract/tooling layout.
- [`ROOT_API_TOKEN_LAYOUT.md`](ROOT_API_TOKEN_LAYOUT.md) — root API and token metadata organization.
- [`NODE_RUNTIME.md`](NODE_RUNTIME.md) — Node 24/25/pnpm toolchain and no-nvm/no-Corepack bootstrap.
- [`BUILD_RECOVERY.md`](BUILD_RECOVERY.md) — pnpm/install/build recovery.
- [`TYPESCRIPT_BUILD_FIXES.md`](TYPESCRIPT_BUILD_FIXES.md) — TypeScript, Prisma, Sui, and workspace build boundaries.
- [`RELEASE_TOOLING.md`](RELEASE_TOOLING.md) — pnpm, Vercel, Postman, redirects, and release validation.

## Validation records

Supporting validation records include:

- [`DEPENDENCY_AWARE_VALIDATION.md`](DEPENDENCY_AWARE_VALIDATION.md)
- [`FAILURE_SAFETY_VALIDATION.md`](FAILURE_SAFETY_VALIDATION.md)
- [`OPERATIONS_VALIDATION.md`](OPERATIONS_VALIDATION.md)
- [`REAL_NTT_BRIDGE_VALIDATION.md`](REAL_NTT_BRIDGE_VALIDATION.md)
- [`VALIDATION_PROTOCOL_COMPILER.md`](VALIDATION_PROTOCOL_COMPILER.md)
- [`WORKSPACE_UPGRADE_VALIDATION.md`](WORKSPACE_UPGRADE_VALIDATION.md)
- [`VALIDATION_STAKING_2026-08-16.md`](VALIDATION_STAKING_2026-08-16.md) — staking + monorepo source validation and environment boundary.
- [`validation/RUNTIME_TRUST_2026-08-17.md`](validation/RUNTIME_TRUST_2026-08-17.md) — Cloudflare/Vercel client-IP trust, durable throttling, API-key smoke authentication, and route-policy validation.

## Documentation rules

- Keep root Markdown limited to `README.md`, `CHANGELOG.md`, and `CONTRIBUTORS.md`.
- Put implementation detail in `docs/` or the owning workspace.
- Keep one canonical setup flow; do not duplicate stale Node/pnpm requirements.
- Do not document unverified deployment IDs as production facts.
- Do not treat explorer/indexer/market data as Bridge finality evidence.
- Keep one blank line between Markdown blocks.

Run:

```bash
pnpm docs:fix
pnpm docs:lint
```

The repository enforces MD012, MD022, and MD032 spacing rules.

## API reference

- [PowerChain | DeFAI API Docs](../api/postman/API_DOCS.md) — Postman-oriented production API guide and generated endpoint inventory.
- [Postman Flows architecture](POSTMAN_FLOWS_ARCHITECTURE.md) — master preflight, Sui/Jupiter Swap, Bridge monitoring, typed variable mappings, visual block model, and wallet-signature boundaries.
- [Environment, providers, features, and runtime policy](ENV_PROVIDER_FEATURES.md)

- [Monorepo and program architecture](MONOREPO_PROGRAM_ARCHITECTURE.md)

- [`SWAP_CORE_ARCHITECTURE.md`](SWAP_CORE_ARCHITECTURE.md) — provider-neutral Swap validation, protection, fee math, and execution-state ownership.

- [Transaction and data architecture](TRANSACTION_DATA_ARCHITECTURE.md)

- [`VALIDATION_RUNTIME_LIFECYCLE_HARDENING_2026-08-16.md`](./VALIDATION_RUNTIME_LIFECYCLE_HARDENING_2026-08-16.md) — Prisma lifecycle, database import safety, realtime generation guards, escrow hook signer boundary, and workspace typecheck coverage.
- [`VALIDATION_RUNTIME_EVIDENCE_HARDENING_2026-08-16.md`](./VALIDATION_RUNTIME_EVIDENCE_HARDENING_2026-08-16.md) — RPC-verified escrow execution, staking RPC redundancy, typed provider diagnostics, and realtime liveness evidence.

- [`VALIDATION_STAKING_UI_LIGHT_FIRST_2026-08-16.md`](./VALIDATION_STAKING_UI_LIGHT_FIRST_2026-08-16.md) — light-first staking UI, wallet position verification, and runtime-data validation.
- [`VALIDATION_STAKING_RUNTIME_UX_2026-08-17.md`](./VALIDATION_STAKING_RUNTIME_UX_2026-08-17.md) — staking runtime refresh, balance-state accuracy, amount guards, and ambiguous-transaction recovery.

- [Staking transaction recovery validation](./VALIDATION_STAKING_TRANSACTION_RECOVERY_2026-08-17.md)

- [Route observability](./ROUTE_OBSERVABILITY.md) — static critical-route telemetry labels, dynamic parameter isolation, and recovery navigation policy.
- [Route policy enforcement](./ROUTE_POLICY_ENFORCEMENT.md) — centralized critical-route feature/rate policy, 405 handling, request IDs, and bounded local limiter behavior.

- [Route Policy Diagnostics](./ROUTE_POLICY_DIAGNOSTICS.md)

- [Production readiness](./PRODUCTION_READINESS.md) — aggregate database/provider/worker/queue/request-policy readiness and deployment smoke checks.

- [Worker retry, manual reconciliation, and queue age](./WORKER_RETRY_AND_QUEUE_AGE.md)

- [Worker drain mode](./WORKER_DRAIN_MODE.md) — maintenance/deploy drain behavior and readiness gating.

- [Runtime Maintenance Control](./RUNTIME_MAINTENANCE_CONTROL.md) — persisted audited drain/resume control with fail-safe environment override.
- [Programs and contracts runtime](./PROGRAMS_AND_CONTRACTS.md)

- [Program runtime freshness](./PROGRAM_RUNTIME_FRESHNESS.md) — bounded verification deadlines and client evidence aging.

- [Program runtime evidence cache](./PROGRAM_RUNTIME_EVIDENCE_CACHE.md)

- [Program runtime abort + cache invalidation](./PROGRAM_RUNTIME_ABORT_AND_CACHE_INVALIDATION.md) — deadline cancellation and configuration-aware evidence caching.
- [Program deployment evidence](./PROGRAM_DEPLOYMENT_EVIDENCE.md) — Solana loader ownership and Sui shared-object runtime evidence.

- [Swap dependency surface](./SWAP_DEPENDENCY_SURFACE.md)

- [`DEVCONTAINER.md`](DEVCONTAINER.md) — secure VS Code/Codespaces Node workspace + PostgreSQL Compose development environment.
