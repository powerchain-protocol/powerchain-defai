# PowerChain service topology

PowerChain `1.0.0` has one interactive application runtime and three asynchronous worker processes.

| Runtime | Package | Responsibility |
| --- | --- | --- |
| Web/API | `@powerchain/bridge` | Next.js application, versioned API routes, wallet UX, status/readiness surfaces |
| Bridge worker | `@powerchain/worker-bridge` | leased bridge reconciliation and settlement progression |
| Claims worker | `@powerchain/worker-claims` | claim queue processing and retry/recovery |
| Fee worker | `@powerchain/worker-fees` | service-fee settlement queue processing and reconciliation |

`@powerchain/backend` is **not** a standalone network daemon. It is the canonical server-side business-logic library consumed by the Next.js API runtime and worker processes. `pnpm dev:backend` therefore runs TypeScript watch mode only; it does not open a port.

## Local development

```bash
pnpm dev              # web/API only
pnpm dev:services     # all three workers
pnpm dev:stack        # web/API + all three workers
pnpm dev:backend      # backend library typecheck/watch only
```

## Worker readiness

The required worker topology is declared once in `apps/backend/src/workers/config.ts` as `bridge`, `claims`, and `fees`.

System readiness distinguishes:

- **expected** — number of required worker kinds;
- **observed** — worker kinds with a persisted heartbeat;
- **readyCount** — observed worker kinds whose heartbeat is within the configured freshness window;
- **missing** — required kinds with no heartbeat evidence;
- **stale** — required kinds with heartbeat evidence that is too old.

A required worker row is never counted as observed merely because the readiness service knows that the worker kind is required. Async settlement remains fail-closed until every required worker has fresh heartbeat evidence.

Worker heartbeat state is operational evidence only and is not bridge finality, balance, reward, or settlement accounting authority.
