# Production validation

PowerChain Bridge stays at version `1.0.0`.

## 2026-08-16 release-tooling validation

The release-tooling pass pins Node `24.x` and pnpm `11.22.0`, adds Postman generation/checks, canonical Next.js redirects, Vercel build/install configuration, source-controlled pnpm lifecycle approval, telemetry-disabled Next commands, and route-contract validation. Source-level production gates pass.

A real dependency-backed install/build is still not claimed in this execution container: it runs Node `22.16.0`, has no pnpm binary, has no `pnpm-lock.yaml`, and Corepack cannot download pnpm from `registry.npmjs.org`.

## Completed in this build environment

The consolidated source tree passed all source-level production gates, including:

- workspace/package/version integrity;
- TypeScript/TSX syntax parsing across 299 source files;
- bridge core and runtime wiring;
- claim/assets and claim/bridge orchestration;
- RPC/data/provider checks;
- wallet/portfolio and wallet-flow checks;
- service-fee checks;
- UI/UX checks, including active navigation, route-level loading/error recovery and mobile wallet ergonomics;
- Markdown MD012/MD022/MD032 structure checks;
- runtime environment-file packaging guard;
- canonical operation recovery/journal checks;
- API registry/filesystem route coverage;
- local relative import resolution;
- mirrored database migration integrity.

Additional build-hardening fixes applied during the dependency-aware attempt:

- normalized backend ESM relative imports that incorrectly ended in `.ts`;
- fixed `apps/bridge/tsconfig.json` alias resolution by making its `baseUrl` app-local;
- added explicit Node type declarations to Node-targeted workspaces;
- corrected service-fee operator authorization imports and error-response ordering;
- corrected `exactOptionalPropertyTypes` object construction in governance/readiness code;
- configured Prisma 7 client generation explicitly for `runtime = "nodejs"`, `moduleFormat = "esm"`, and TypeScript import extensions.

## Dependency-aware gate attempt

The following command sequence is the canonical final validation gate:

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:validate
pnpm typecheck
pnpm build
```

The environment has Node `22.16.0` and global TypeScript `5.8.3`, but package installation cannot currently start because outbound DNS for `registry.npmjs.org` fails with `EAI_AGAIN`. Corepack therefore cannot download the pinned `pnpm@11.22.0` package. Because dependencies are not installed, Prisma CLI generation/validation and the real Next.js production build cannot truthfully be marked PASS in this environment.

The repository now exposes the combined commands:

```bash
pnpm validate:dependency-aware
pnpm validate:all
```

`validate:all` runs source production verification followed by Prisma generation, Prisma validation, workspace typechecking and the Next.js production build.

## Database/live-chain gates

Against the intended production database:

```bash
pnpm db:status
pnpm db:migrate:deploy
```

Live deployment additionally requires the real Solana/Sui RPC endpoints, PWRC/wPWRC identifiers, Wormhole NTT manager/transceiver deployment data, signer/HSM configuration, fee policy, and wallet execution tests. Source checks do not replace those external-system validations.

## 2026-08-15 pnpm 11.22.0 dependency-aware gate

The source tree is pinned to `pnpm@11.22.0`. A direct `source ./bootstrap.sh` was attempted in this execution environment and failed before installation because the registry request for `pnpm-11.22.0.tgz` could not be completed. Source-level production, migration-parity, environment, workspace-import, and TypeScript syntax gates pass; dependency-aware Prisma/Next gates must run where registry access is available.

## 2026-08-15 UI/UX and release-artifact refinement

This pass additionally completed the following source-level checks after the Bridge UI/UX changes:

- TypeScript/TSX syntax gate: PASS;
- type-hygiene gate: PASS;
- Markdown structure gate with MD012/MD022/MD032: PASS;
- workspace/import/environment-artifact gate: PASS;
- Bridge UI/UX production gate: PASS;
- Wallet UI/UX and wallet-flow gates: PASS;
- wallet action-safety gate: PASS;
- review/recovery gate: PASS;
- claim/bridge orchestration UI/UX gate: PASS;
- operation-recovery UI/UX gate: PASS;
- protocol source gate: PASS;
- full production source gate: PASS.

The release tree now contains only environment templates; runtime `.env`, `.env.local`, and `.env.production` files were removed from the artifact and are rejected by the workspace source gate.

The uploaded source still does not include `pnpm-lock.yaml`. This execution environment also runs Node `22.16.0`, has no installed pnpm binary, and cannot reach `registry.npmjs.org`, so a real pnpm dependency resolution, Prisma generation, Next.js typecheck, and production build cannot be truthfully marked PASS here. Generate and commit the lockfile with the pinned pnpm version in a network-enabled Node 24.x environment before using frozen-lockfile CI.

## 2026-08-15 documentation consolidation

The documentation surface was cleaned without changing protocol/runtime behavior:

- root `README.md` was reduced to onboarding, architecture, setup, safety, and release-gate guidance;
- `CHANGELOG.md` was normalized under the single `1.0.0` release hierarchy;
- `docs/README.md` became the canonical documentation index;
- scoped README files now describe ownership/responsibility instead of repeating root documentation;
- existing focused validation records were retained as supporting evidence and linked from the canonical validation index;
- Markdown spacing remained compliant with MD012, MD022, and MD032.

Validation after the documentation pass:

```text
markdown-structure-check: PASS
full-production-check: PASS
```

This documentation-only pass does not change the dependency-aware release limitation: Prisma generation, dependency-backed TypeScript checking, and the Next.js production build must be run in a correctly installed pnpm workspace before those gates are claimed as passed.

## 2026-08-15 multichain operations and endpoint upgrade

This pass extended the existing 1.0.0 source with the configured Solana auxiliary Bridge program, the Sui shared Bridge configuration model, default wPWRC → PWRC routing, persisted bridge audit events, and transport/endpoint failover hardening.

Source-level validation passed after the upgrade:

```text
POWERCHAIN_TYPESCRIPT_SYNTAX_CHECK_PASS files=299
type-hygiene production check PASS
POWERCHAIN_WORKSPACE_PRODUCTION_CHECK_PASS version=1.0.0
protocol-production-check: PASS
real bridge production check: PASS
POWERCHAIN_RUNTIME_WIRING_CHECK_OK version=1.0.0
bridge-core-production-check: PASS
uiux-production-check: PASS
operations-production-check: PASS
failure-safety production gate PASS
markdown-structure-check: PASS
protocol-layout.test.mjs: PASS
Full production source gate PASS
markdown-link-check: PASS
```

The blocking Sui bridge runtime path now uses gRPC/Core API reads with ordered endpoint fallback. Application transfer status rotates configured WebSocket endpoints and degrades to persisted SSE and cursor-based polling.

The dependency-aware limitation is unchanged: `pnpm-lock.yaml` is not present in the supplied source and this execution environment is Node 22 without an installed pnpm binary, so Prisma generation, dependency-backed TypeScript checking, and the Next.js production build are not claimed as passed.

## 2026-08-15 production dashboard and brand-asset redesign

The Bridge product shell was rebuilt against the supplied PowerChain UI references and canonical logo/token artwork while preserving the existing protocol and accounting boundaries.

Implemented and source-validated:

- solid dark PowerChain desktop navigation rail with a light settlement workspace;
- compact mobile brand header and safe-area bottom navigation;
- focused dark NTT transfer card with explicit Sui wPWRC → Solana PWRC context;
- optimized local PowerChain logo variants, PWRC/wPWRC artwork, and App Router icon;
- live Solana/Sui settlement overview backed by provider health, finalized heads, latency, transport type, and configured endpoint availability;
- database-backed recent-transfer summary with resilient loading, empty, and unavailable states;
- validated bridge-history status input and bounded pagination limit parsing without unsafe `as never` filtering;
- explicit prevention of synthetic TVL, TPS, success-rate, ZK-proof, carbon-neutral, or unsupported multi-chain claims in the new production overview;
- cinematic theme primitives are present for controlled gradients/glassmorphism, while emerald/bright-green tokens remain absent from the Bridge application.

Source validation after the redesign:

```text
POWERCHAIN_TYPESCRIPT_SYNTAX_CHECK_PASS files=305
Type hygiene: PASS
POWERCHAIN_UIUX_DASHBOARD_REDESIGN_CHECK_PASS version=1.0.0
Markdown structure: PASS
Workspace configuration: PASS
Protocol production check: PASS
Real NTT bridge check: PASS
Runtime wiring: PASS
Full production source gate: PASS
```

A dependency-backed build was attempted again. It is still blocked before dependency resolution because the container runs Node `22.16.0` while the repository requires Node `>=24 <26`, and Corepack cannot download the pinned `pnpm@11.22.0` because `registry.npmjs.org` is unreachable (`EAI_AGAIN`). The uploaded source also has no `pnpm-lock.yaml`. Therefore Prisma generation, installed-dependency TypeScript checking, and `next build` are not claimed as passed in this environment.

## Theme and infrastructure gate

`scripts/theme-infrastructure-production-check.mjs` pins the onyx theme/toggle, Next.js `proxy.ts`, Vercel production configuration, Helius endpoint derivation with fallbacks, Sui gRPC failover, and the non-authoritative Cetus integration boundary.

## 2026-08-15 theme persistence and mobile navigation hardening

The follow-up UI/UX pass fixed persisted theme bootstrapping and completed mobile route discovery. A saved theme is applied before hydration, synchronized across tabs, and updates the browser theme color. Mobile keeps the compact bottom navigation while a keyboard-safe header drawer exposes Bridge, History, Wallet, Claim, Assets, Fees, and Integrations.

Additional release-surface hardening includes root loading/error boundaries, a standalone web-app manifest, a solid onyx header/footer treatment, removal of generic blue/navy interaction styling, and bounded validation of client-supplied `x-request-id` values in `proxy.ts`.

Source validation after this pass:

```text
POWERCHAIN_TYPESCRIPT_SYNTAX_CHECK_PASS files=316
type-hygiene production check PASS
POWERCHAIN_WORKSPACE_PRODUCTION_CHECK_PASS version=1.0.0
POWERCHAIN_UIUX_DASHBOARD_REDESIGN_CHECK_PASS version=1.0.0
POWERCHAIN_THEME_INFRASTRUCTURE_PRODUCTION_CHECK_PASS version=1.0.0
POWERCHAIN_RUNTIME_WIRING_CHECK_OK version=1.0.0
protocol-production-check: PASS
real bridge production check: PASS
operations-production-check: PASS
failure-safety production gate PASS
markdown-structure-check: PASS
protocol-layout.test.mjs: PASS
Full production source gate PASS
```

The dependency-backed release gate remains unresolved in this container: Node is `22.16.0`, pnpm is unavailable, and `pnpm-lock.yaml` is not present. The repository requires Node `>=24 <26` and pnpm `11.22.0`, so Prisma generation and the installed-dependency Next.js production build are not claimed as passed here.

## 2026-08-15 provider redundancy and refresh refinement

The latest refinement removes the remaining Wormhole NTT `as never` type escape, adds explicit background-refresh state to provider health UI, prevents duplicate refresh actions, and moves the active-transfer banner below the sticky mobile header.

Sui fallback readiness is now evidence-based: every configured gRPC endpoint is probed independently and `full` redundancy requires at least two responding endpoints. The settlement overview reports healthy endpoints rather than configured endpoint count.

The UI/UX production checker now pins these invariants.

## Data/metrics refinement validation

The persisted metrics layer now validates selectable 24-hour, 7-day, and 30-day windows, strict `windowHours` API input, direction counts, completed principal in the selected window, and lifecycle timing derived from stored source-finality, Wormhole-observation, and destination-finality timestamps.

Metrics refresh remains abort-safe, timeout-bounded, visibility-aware, and offline-aware. The metrics endpoint remains non-authoritative for bridge accounting and uses `no-store` responses.

The `bridge_transfers(created_at)` and `bridge_transfers(direction, created_at)` indexes are mirrored byte-for-byte between Prisma and Supabase migrations. `scripts/data-production-check.mjs` now pins these query-performance and lifecycle-metrics boundaries.
