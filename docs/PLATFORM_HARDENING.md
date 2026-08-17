# Platform hardening

PowerChain Bridge `1.0.0` exposes three platform endpoints:

- `GET /api/v1/health` — process liveness; does not depend on RPC or database availability.
- `GET /api/v1/ready` — strict database + Solana + Sui readiness; returns HTTP 503 until dependencies are ready.
- `GET /api/v1/version` — immutable public release/API identity.

Workers are supervised with bounded tick and shutdown timeouts. A timed-out tick is treated as a failed iteration and enters bounded exponential backoff. Shutdown aborts the active tick, removes the worker heartbeat, and disconnects Prisma.

The production Next configuration uses `.next`, standalone output, monorepo output-file tracing, server-side Prisma/pg externals, no production browser source maps, and security headers including HSTS in production.

Run source-level platform validation with:

```bash
node scripts/platform-production-check.mjs
node scripts/typescript-syntax-check.mjs
node scripts/workspace-production-check.mjs
node scripts/full-production-check.mjs
```

Dependency-aware validation remains:

```bash
source ./bootstrap.sh
pnpm install
pnpm validate:all
```
