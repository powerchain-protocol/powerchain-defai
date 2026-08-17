# Production readiness

PowerChain separates **liveness**, **execution readiness**, and **accounting/finality evidence**. No single health endpoint is allowed to fabricate balances, rewards, settlement state, or blockchain finality.

## Runtime contracts

- `GET /api/v1/health` proves that the web process can answer requests.
- `GET /api/v1/ready` is the existing database + provider execution gate.
- `GET /api/v1/system/readiness` is the aggregate operational envelope for production promotion and operator dashboards.
- `GET /api/v1/system/route-policy` exposes sanitized process-local request-policy pressure.
- `GET /api/v1/operations/status` exposes persisted worker heartbeats and queue attention.

`/api/v1/system/readiness` returns `503` when database/provider prerequisites block new operations. A `200` response can still be `degraded` when workers are stale, queues need attention, providers have reduced redundancy, or the process-local request limiter is under pressure.

The response distinguishes capabilities:

- `reads`: fresh provider evidence is available for read paths;
- `newOperations`: database and providers are ready for new wallet-owned operations;
- `asyncSettlement`: worker heartbeat evidence is present in addition to new-operation prerequisites.

The readiness payload explicitly declares `authoritativeForBalances: false` and `authoritativeForSettlement: false`.

## Promotion commands

Before deployment, load the real production environment (or production secret injection used by your deployment runner) and run:

```bash
pnpm deploy:preflight
```

`deploy:preflight` now separates two environment contracts:

- `pnpm env:schema:check` validates checked-in environment templates and canonical key ownership;
- `pnpm env:runtime:check` validates actual production values without printing secrets. It rejects localhost database/RPC endpoints, optional API-key mode, missing API keys, non-mainnet network selection, and missing Wormhole NTT deployment identifiers when bridge/cross-chain execution is enabled.

A Cloudflare Worker can keep encrypted runtime secrets in Cloudflare rather than local `.env.production`; those bindings must be verified in the deployment environment because source preflight cannot read encrypted platform secrets.

After deployment, from a network location that can reach the production application:

```bash
POWERCHAIN_SMOKE_BASE_URL=https://your-production-host.example POWERCHAIN_SMOKE_API_KEY=<ci-secret> pnpm deploy:smoke
```

The smoke command accepts `POWERCHAIN_SMOKE_API_KEY` (or the first valid `POWERCHAIN_API_KEYS` entry for local operator runs), never logs the key, requires HTTPS outside localhost, and uses bounded retries for cold-start/transient 5xx conditions and fails unless health is live, core security headers are present, `/ready` is ready, aggregate system readiness is `ready`, new operations and async settlement are enabled, and route-policy pressure is normal. It never submits a wallet, staking, escrow, bridge, swap, or payment transaction.

## Production dependency boundary

A release candidate still requires the real checkout to run its frozen dependency install, semantic TypeScript checks, Next.js build, Prisma validation/migrations, Anchor/Cargo compilation and the applicable live RPC/wallet test plan. Source-only production gates are necessary but are not a substitute for those checks.
