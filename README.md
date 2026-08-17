# Install

Use pnpm `11.22.0` from the monorepo root. PowerChain declares package compatibility as Node `>=24 <26`, but pnpm manages the reproducible project runtime at **Node 24.19.0**. If the shell is on Node 24.0.0, `pnpm install` downloads/uses the pinned project runtime instead of accepting that older 24.x runtime for lifecycle work.

```bash
pnpm install
pnpm env:bootstrap
pnpm dev
```

For local development, `pnpm dev` is self-healing: it runs `workspace:install:ensure`, performs one root `pnpm install --no-frozen-lockfile` if critical workspace packages are missing, verifies the install, then starts the app. CI, build, typecheck and release commands stay non-mutating and continue to use the strict `workspace:install:check`. Set `POWERCHAIN_AUTO_INSTALL=0` to force strict local behavior.

# Quick Install

If pnpm runtime download is restricted, pnpm is missing, or the workspace is stale, use the checked-in bootstrap. It installs and activates Node `24.19.0` plus pnpm `11.22.0`, then rebuilds the workspace from current manifests.

```bash
source ./bootstrap.sh
pnpm workspace:repair
pnpm workspace:install:check
pnpm env:bootstrap
pnpm dev
```

For the database-backed Bridge/claims/fees worker stack, start or configure PostgreSQL first:

```bash
pnpm db:preflight
pnpm db:migrate:deploy
pnpm dev:stack
```

# PowerChain DeFAI

PowerChain DeFAI is a pnpm full-stack monorepo for wallet-authorized AI-assisted DeFi workflows across Solana and Sui. It combines swaps, Wormhole NTT bridging, staking, claims, transaction monitoring, provider diagnostics, APIs, workers, persistence, and an advisory AI assistant without giving AI signing or custody authority.

## Runtime

- Node.js engine: `>=24 <26`; development pin: `24.19.0`.
- pnpm: `>=11.22.0 <12`; package manager pin: `pnpm@11.22.0`.
- TypeScript: `7.0.2`; tsx: `4.23.12`; `@types/node`: `26.2.0`.
- Next.js: `16.3.1`; React / React DOM: `19.2.8`.
- Solana Kit: `7.1.0`; Mysten Sui: `2.26.1`; Sui dApp Kit React: `2.1.19`.
- Prisma: `7.9.1`; PostgreSQL: `pg@8.23.0`; Supabase JS: `2.110.8`.
- Axios: `1.19.0`; ws: `8.21.3`; dotenv: `17.4.2`.

## Applications

- `apps/web` — public marketing frontend on port `3001`, composed from modular `website/ui` sections.
- `apps/bridge` — application/dashboard + API frontend on port `3000` with chat, swap, Bridge, staking, wallet, claims, settings, integrations and status.
- `apps/backend` — Node/server-side domain, provider, persistence, routing, transaction and AI services shared by Next.js route handlers and direct worker runtimes.
- `apps/chat` — shared AI/chat contracts, provider/model metadata and React utilities.
- `apps/staking` — deployment-gated Solana/Sui staking contracts and verification policy.
- `apps/worker-bridge` — Bridge reconciliation/finality worker.
- `apps/worker-claims` — claims/finality worker.
- `apps/worker-fees` — service-fee reconciliation worker.

Shared code lives under `packages/`, `shared/`, and `clusters/`. API contracts live under `api/`.

## Frontends

Run the application and public marketing site independently:

```bash
pnpm dev       # app/dashboard/API on http://localhost:3000
pnpm dev:web   # marketing site on http://localhost:3001
```

`apps/web/website/ui/` contains modular `header.tsx`, `footer.tsx`, `hero.tsx`, `products.tsx`, `features.tsx`, `partnerships.tsx`, `faq.tsx`, `cta.tsx`, `logo.tsx`, and `shell.tsx`. The marketing site links into the canonical application dashboard instead of duplicating application routes.

## Application navigation

The application opens on `/dashboard`. The workspace sidebar is grouped into **Overview**, **Intelligence**, **Markets**, **Portfolio**, **Network**, and **Account** sections. Dashboard has its own collapsible command-center sidebar, header and navigation-free footer. The viewport shell is fixed; only page content scrolls (with hidden scrollbars), while sidebar navigation scrolls independently only when it overflows.

Sui wallet integration uses one stable module-scope dApp Kit instance by default. Custom Sui RPC changes are applied after React commit, preventing dApp Kit store updates from running during another provider's render.

## API

The filesystem route registry is canonical. Generated API artifacts cover the complete route surface instead of maintaining a partial handwritten specification.

```bash
pnpm api:generate
pnpm api:check
pnpm postman:generate
pnpm postman:check
```

Runtime contracts:

```text
GET /api/v1/openapi
GET /api/v1/bridge/openapi
GET /api/v1/swap/openapi
GET /api/v1/health
GET /api/v1/ready
GET /api/v1/version
```

`api/swagger.yaml`, Bridge/Swap OpenAPI files, Postman collections and the generated SDK route registry are validated against the application route inventory before release.

## AI providers

The backend supports PowerChain-hosted providers, OpenAI, DeepSeek through the OpenAI-compatible transport, Google GenAI/Gemini, Anthropic, and OpenRouter. Secrets remain server-side.

```env
POWERCHAIN_AI_PROVIDER=auto
POWERCHAIN_AI_MODEL=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=
GOOGLE_GENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
```

AI remains advisory-only: it cannot sign, submit, finalize, settle, or custody blockchain transactions.

## Backend compatibility

The default backend uses the latest pinned compatible package surfaces and a runtime-neutral HTTPS Cetus adapter rather than installing an SDK dependency chain that can impose a narrower Node engine on the entire workspace. Sui transactions remain on `@mysten/sui`; Solana RPC primitives use `@solana/kit`.

Database ownership is explicit in `@powerchain/database` (`@prisma/client`, `@prisma/adapter-pg`, `pg`, Supabase), while backend services consume that package and keep provider secrets server-only.

## Environment

`.env.example` is the canonical environment schema and `config/env.defaults` is the non-secret recovery fallback. Generated `.env`, `.env.local`, Dev Container credentials, private keys, provider secrets, database passwords, build outputs and package-manager caches are ignored.

```bash
pnpm env:bootstrap
pnpm env:check
```

## Common commands

```bash
pnpm dev
pnpm dev:web
pnpm dev:stack
pnpm typecheck
pnpm build
pnpm api:check
pnpm verify:production
pnpm validate:all
pnpm clean
```

Use `./pnpmw <command>` when a shell does not already expose a pnpm binary.

## Security boundaries

- Wallets remain the signing authority for Solana/Sui transactions.
- PWRC uses SPL Token-2022.
- Wormhole NTT is the principal-movement bridge path for PWRC/wPWRC.
- Custom RPC/API endpoints are opt-in and validated.
- Browser-supplied credentials remain transient where supported and are not exported with saved settings.
- Server credentials never use `NEXT_PUBLIC_*` variables.
- Staking and settlement paths fail closed until deployment/runtime verification succeeds.

## Documentation

Architecture, security, operations, recovery, Bridge, staking and runtime documents live under [`docs/`](docs/). API/OpenAPI/Postman assets live under [`api/`](api/).

## License

MIT. See [`LICENSE`](LICENSE).
