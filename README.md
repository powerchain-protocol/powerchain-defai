# PowerChain DeFAI

**PowerChain DeFAI** is a production-oriented full-stack monorepo for wallet-authorized DeFi workflows across **Solana** and **Sui**. It combines swaps, cross-chain bridging, staking, claims, wallet operations, transaction monitoring, provider diagnostics, persistent workers, APIs, and an advisory AI assistant in one operational workspace.

> **Security model:** the connected wallet remains the signing authority. AI, backend services, and workers do not receive custody or autonomous transaction-signing authority.

## Highlights

- Solana and Sui wallet-aware application workflows.
- Provider-neutral swap orchestration with explicit transaction review.
- Wormhole NTT bridge workflows with durable status and reconciliation.
- Deployment-gated staking and claim flows.
- Wallet portfolio, activity, assets, history, fees, and explorer views.
- Advisory AI with server-side provider credentials.
- Generated OpenAPI, SDK route registry, and Postman artifacts.
- PostgreSQL/Prisma persistence with background reconciliation workers.
- Health, readiness, provider diagnostics, route policy, and runtime trust checks.
- Production validation scripts for application, backend, workers, routing, security, data, protocol, and deployment boundaries.

## Application workspace

The default Next.js experience is the wallet-enabled `apps/bridge` application and command center:

```text
http://localhost:3000/
```

The public marketing site is available separately through `apps/web`:

```text
http://localhost:3001/
```

The dashboard shell persists across the operational workspace, including:

```text
/
/chat
/swap
/bridge
/staking
/wallet
/assets
/claim
/history
/fees
/explorer
/protocol
/integrations
/status
/profile
/settings
```

The marketing site now includes dedicated static About content, reusable mini-hero public pages, local legal routes (`/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/disclaimer`), essential-storage notice UI, class-driven Tailwind v4 brand tokens, and a centered wallet chooser that treats rejected wallet prompts as cancellation rather than application errors.

Dynamic bridge and claim status routes remain inside the same workspace shell. Legal routes use their own presentation surface.

The Swap workspace statically includes both Solana and Sui client runtimes to avoid stale Turbopack async-chunk failures during development. Bridge `predev` also clears only `.next/dev` and `.next/cache` before launching; production build output is not touched. The AI chat composer is capped at 2,000 characters and keeps link/image URL actions, the live character counter, and send action inside one accessible composer surface.

The application owns the default local port. `/dashboard` is retained only as a compatibility redirect to `/`. The marketing site can still hand users into the application through allowlisted `/open/[slug]`, `/redirects/[slug]`, and `/auth/[slug]` routes.

## Architecture

```text
powerchain-defai/
├── apps/
│   ├── bridge/          # Next.js dashboard, application UI, and API routes
│   ├── web/             # Public marketing site
│   ├── backend/         # Server-side services and domain integrations
│   ├── chat/            # Shared AI/chat contracts and React utilities
│   ├── staking/         # Deployment-gated staking package
│   ├── worker-bridge/   # Bridge reconciliation/finality worker
│   ├── worker-claims/   # Claims reconciliation/finality worker
│   └── worker-fees/     # Fee reconciliation worker
├── packages/
│   ├── protocol/        # Canonical protocol and chain configuration
│   ├── runtime/         # Runtime health, readiness, errors, and safety utilities
│   ├── database/        # Prisma/database ownership boundary
│   ├── bridge-core/     # Provider-neutral bridge domain logic
│   ├── swap-core/       # Provider-neutral swap domain logic
│   └── sdk/             # PowerChain TypeScript SDK
├── api/                 # OpenAPI, Postman, and generated API artifacts
├── clusters/            # Chain/network configuration
├── config/              # Shared non-secret configuration
├── contracts/           # Contract-related assets and interfaces
├── docs/                # Architecture, operations, security, and runbooks
├── prisma/              # Prisma schema and migrations
├── programs/            # On-chain program sources/configuration
├── scripts/             # Validation, generation, recovery, and operations tooling
├── shared/              # Shared application modules
├── supabase/            # Supabase project assets
├── tests/               # Cross-workspace tests
└── tokens/              # Token configuration/assets
```

### Runtime boundaries

PowerChain separates browser-safe code from server/runtime code deliberately.

- Client Components must not import `@powerchain/backend`.
- Browser-safe explorer and protocol helpers live in `@powerchain/protocol`.
- `apps/backend` is Node/server-compatible and must not depend on Next.js `server-only` markers in code consumed by direct workers.
- Workers import narrow backend entry points such as `@powerchain/backend/claims`, `@powerchain/backend/fees`, `@powerchain/backend/bridge`, and `@powerchain/backend/workers` instead of the backend root barrel.
- Database ownership is centralized in `@powerchain/database`.
- Provider/API secrets remain server-side and must never be exposed through `NEXT_PUBLIC_*` variables.

These boundaries are enforced by production validation scripts, including `backend-runtime-boundary:production:check` and workspace dependency checks.

## Claim and operational status architecture

Claims and runtime status use persisted/server-authoritative evidence rather than optimistic browser state.

- `/claim` performs server eligibility, wallet proof, reservation, submission, and recovery orchestration. Ambiguous network/timeout failures after a reservation are journaled as `UNKNOWN` and redirected to the persisted claim-status route instead of encouraging a duplicate mutation.
- `/claims/status/[claimId]` reads the canonical persisted claim record through the dedicated `@powerchain/backend/claims` boundary and represents `RESERVED`, `SUBMITTING`, `SUBMITTED`, `FINALIZED`, `FAILED`, `EXPIRED`, and `UNKNOWN` states without inventing completion.
- `/status` consolidates system readiness, provider redundancy, route-policy pressure, worker/queue health, and sanitized process-local diagnostics through `types/status.ts`, `services/status.ts`, `utils/health.ts`, and `hooks/use-status.ts`. Evidence errors are deduplicated for operators, refresh is suppressed while the browser is offline, and age-based staleness is enforced in addition to provider-specific freshness checks.
- Status refresh cadence and process-local telemetry visibility are browser preferences in Settings. They never relax server execution gates or make telemetry authoritative for balances/finality.
- Operational routes now share recovery boundaries: Swap, Chat, Explorer, Protocol, Staking, and persisted Bridge Status render consistent retry/history/status actions without reflecting raw exception text. Bridge status detail links are constructed through the canonical route-safe helper. Public wallet/chain/transaction APIs and bridge SSE updates follow the same fixed-message contract: provider/RPC exception text stays server-side, while clients receive bounded machine-style codes and request IDs.
- Program readiness tracks online/offline and evidence freshness. Configured source identifiers are never promoted to deployed state without live chain verification.

The shared application design tokens live in `apps/bridge/styles/theme.css`: controls use a 14px radius, cards 20px, large panels 24px, with white/light-gray surfaces and dark-green iconography in light mode plus matched low-glow dark surfaces. Shared cards can also render semantic `section`, `aside`, or `article` landmarks without forking the visual contract. Settings, Claim, Status, Swap, and Bridge consume the same Card/Button/Input/Select geometry instead of maintaining page-specific radii.

Runtime helpers are intentionally bounded: `TTLCache` supports capacity limits, expiry pruning, in-flight de-duplication and cached `undefined` values correctly; `server.ts` applies no-store response headers and exposes only explicit machine-style error codes rather than reflecting free-form provider/user messages.

## Requirements

| Tool | Supported version |
| --- | --- |
| Node.js | `>=24 <26` |
| Development Node pin | `24.19.0` |
| pnpm | `>=11.22.0 <12` |
| Package manager pin | `pnpm@11.22.0` |
| Next.js | `16.3.1` |
| React | `19.2.8` |
| TypeScript | `5.9.3` |
| Prisma | `7.9.1` |

The repository uses pnpm's development runtime configuration to keep local lifecycle commands on Node `24.19.0`. Peer dependencies remain strict; the workspace pins TypeScript `5.9.3` and `utf-8-validate` `5.0.10` to satisfy the currently supported Solana/GraphQL/WebSocket peer ranges rather than suppressing peer errors.

## Quick start

From the repository root:

```bash
pnpm install
pnpm env:bootstrap
pnpm dev
```

Dependency lifecycle scripts are fail-closed. The reviewed install-script allowlist is committed in `pnpm-workspace.yaml`; `@google/genai` and `@reown/appkit` are explicitly approved alongside the existing native/runtime dependencies. If pnpm reports `ERR_PNPM_IGNORED_BUILDS`, reconcile the reviewed policy and retry:

```bash
pnpm deps:builds:approve:reviewed
pnpm deps:builds:check
pnpm install
```

For just the two application SDK approvals:

```bash
pnpm deps:builds:approve:required
```

Open the default application dashboard:

```text
http://localhost:3000/
```

Start the public website separately when needed:

```bash
pnpm dev:web
```

Then open `http://localhost:3001/`.

### Bootstrap a stale or incomplete workspace

If pnpm is unavailable, runtime download is restricted, or the workspace install is inconsistent:

```bash
source ./bootstrap.sh
pnpm workspace:repair
pnpm workspace:install:check
pnpm env:bootstrap
pnpm dev
```

`pnpm dev` performs the local workspace-install recovery path before starting the application. CI, build, typecheck, and release workflows remain strict and non-mutating.

Set this to disable local auto-repair behavior:

```bash
POWERCHAIN_AUTO_INSTALL=0 pnpm dev
```

## Environment configuration

`.env.example` is the canonical environment schema. Non-secret recovery defaults live in `config/env.defaults`.

Initialize and validate environment files with:

```bash
pnpm env:bootstrap
pnpm env:check
```

Do not commit:

- `.env`, `.env.local`, or production secrets;
- wallet private keys or signer files;
- RPC/provider credentials;
- database passwords;
- generated local credentials;
- build outputs or package-manager caches.

## Database and worker stack

Bridge, claims, and fee reconciliation depend on PostgreSQL-backed persistence.

Preflight and apply migrations:

```bash
pnpm db:preflight
pnpm db:migrate:deploy
```

Run the application and workers together:

```bash
pnpm dev:stack
```

The worker topology is:

| Workspace | Responsibility |
| --- | --- |
| `@powerchain/worker-bridge` | Bridge lifecycle, retries, finality, and reconciliation |
| `@powerchain/worker-claims` | Claim processing, retries, finality, and reconciliation |
| `@powerchain/worker-fees` | Protocol/service-fee processing and reconciliation |

Workers include runtime controls for readiness, leases/heartbeats, retries, backpressure, drain mode, and recovery.

## AI providers

The backend supports multiple server-side AI providers:

```env
POWERCHAIN_AI_PROVIDER=auto
POWERCHAIN_AI_MODEL=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
GOOGLE_GENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
```

AI is **advisory-only**. It may assist with interpretation, planning, and application workflows, but it cannot sign, submit, finalize, settle, or custody blockchain transactions.

## API

The Next.js filesystem route surface is canonical. Generated API artifacts are checked against the application route inventory.

Generate or validate API assets:

```bash
pnpm api:generate
pnpm api:check
pnpm postman:generate
pnpm postman:check
```

Core runtime endpoints include:

```text
GET /api/v1/openapi
GET /api/v1/bridge/openapi
GET /api/v1/swap/openapi
GET /api/v1/health
GET /api/v1/ready
GET /api/v1/version
GET /api/v1/system/readiness
GET /api/v1/providers/health
GET /api/v1/providers/readiness
GET /api/v1/providers/diagnostics
```

Additional route groups cover bridge transfers, swaps, staking, claims, wallets, assets, fees, integrations, market data, program readiness, security policy, operations, workers, and transaction status.

## Blockchain and protocol safety

- Connected wallets remain the transaction signing authority.
- Solana transaction primitives use `@solana/kit` and supported SPL libraries.
- Sui transaction primitives use `@mysten/sui`.
- PWRC is configured as an SPL Token-2022 asset.
- Wormhole NTT is the cross-chain bridge path for configured PWRC/wPWRC movement.
- Staking and settlement flows fail closed until required deployment/runtime evidence is verified.
- Custom RPC and integration endpoints are opt-in and validated.
- Transaction review and validation occur before wallet approval.
- Runtime/provider failures must not be converted into synthetic blockchain success states.

See [`docs/SECURITY.md`](docs/SECURITY.md), [`docs/FAILURE_SAFETY.md`](docs/FAILURE_SAFETY.md), and [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) for deeper controls.

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dashboard/application |
| `pnpm dev:web` | Start the public marketing site |
| `pnpm dev:stack` | Start application + workers |
| `pnpm typecheck` | Typecheck all participating workspaces |
| `pnpm build` | Build the primary application |
| `pnpm check` | Typecheck + production validation |
| `pnpm verify:production` | Run the production validation suite |
| `pnpm route-metadata:production:check` | Verify primary route titles/descriptions |
| `pnpm validate:all` | Run full + dependency-aware validation |
| `pnpm api:check` | Validate generated API contracts |
| `pnpm postman:check` | Validate generated Postman assets |
| `pnpm deploy:preflight` | Run deployment preflight checks |
| `pnpm deploy:smoke` | Run production smoke checks |
| `pnpm workspace:install:check` | Verify critical workspace resolution |
| `pnpm workspace:repair` | Repair workspace installation state |
| `pnpm clean` | Clean generated build artifacts |

If the shell does not expose pnpm directly, use the repository wrapper:

```bash
./pnpmw <command>
```

## UI reliability

Operational and account routes use shared loading/error recovery boundaries. Profile, Settings, Protocol, DEX pool discovery, wallet activity, fee estimation, token selection and transaction tooling share the same control/card geometry and light/dark theme primitives. Browser/provider exceptions are normalized before presentation so raw endpoint or provider error strings are not reflected into the interface. Primary operational routes also carry explicit title/description metadata guarded by `pnpm route-metadata:production:check`.

## Public error and bridge recovery contract

Browser-facing operational APIs do not reflect arbitrary provider/RPC exception text. Bridge status/recovery URLs are created through the canonical route helper, source-transaction payloads and event windows are bounded, and browser bridge actions understand both legacy string errors and structured `{ error: { code, message } }` envelopes.

```bash
pnpm public-error-contract:production:check
```

The Sui balance/RPC server path imports the narrow `@powerchain/backend/sui/client` export rather than evaluating the backend root barrel.

## Production validation

Before deployment, use:

```bash
pnpm deploy:preflight
```

The validation suite covers, among other areas:

- runtime and Node compatibility;
- browser/server package boundaries;
- workspace dependency ownership;
- TypeScript and React type hygiene;
- application and backend routing;
- route policy and observability;
- provider readiness and diagnostics;
- database and worker topology;
- swap, bridge, staking, claims, wallet, and fee flows;
- protocol/program deployment evidence;
- environment/security policy;
- API/OpenAPI/Postman consistency;
- production UI/UX wiring;
- release metadata and build manifests.

## Documentation

Detailed technical documentation is maintained in [`docs/`](docs/). Recommended entry points:

- [`docs/DEFAI_ARCHITECTURE.md`](docs/DEFAI_ARCHITECTURE.md) — system architecture.
- [`docs/MONOREPO_ROUTING_RUNTIME.md`](docs/MONOREPO_ROUTING_RUNTIME.md) — routing and runtime topology.
- [`docs/RUNTIME_PACKAGE_BOUNDARIES.md`](docs/RUNTIME_PACKAGE_BOUNDARIES.md) — package/runtime separation.
- [`docs/API.md`](docs/API.md) — API overview.
- [`docs/SECURITY.md`](docs/SECURITY.md) — security model.
- [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) — production readiness.
- [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) — local development workflow.
- [`docs/BACKEND_OPERATIONS.md`](docs/BACKEND_OPERATIONS.md) — backend operations.
- [`docs/BRIDGE_OPERATIONS.md`](docs/BRIDGE_OPERATIONS.md) — bridge operations.
- [`docs/STAKING.md`](docs/STAKING.md) — staking architecture and controls.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) and [`CONTRIBUTORS.md`](CONTRIBUTORS.md).

Changes should preserve the wallet-signing security boundary, browser/server package separation, generated API contract consistency, and fail-closed runtime behavior.

## License

MIT. See [`LICENSE`](LICENSE).

### Operational read reliability

Browser-side operational reads are fail-closed and connectivity-aware. Portfolio, pool, liquidity, and PWRC integrity hooks abort stale requests when connectivity changes, preserve only previously verified snapshots, and expose bounded machine-style error states rather than reflecting arbitrary provider text. Portfolio refresh identity is independent of fetched data, preventing successful reads from retriggering their own mount effect. Recent bridge operations use the canonical route helpers for status recovery.

Run the dedicated regression guard with:

```bash
pnpm operational-read-hooks:production:check
```
