# Service topology validation — 2026-08-17

This pass removes an incorrect worker-readiness count and aligns monorepo process orchestration with the actual runtime architecture.

- `@powerchain/backend` is treated as a library, not a standalone daemon.
- `dev:stack` starts the Next.js application and the three supervised workers only.
- worker kinds are defined once in backend worker configuration.
- `observed` counts only persisted heartbeat evidence.
- `readyCount` counts only fresh heartbeats.
- missing and stale worker kinds are exposed separately.
- claims/fees worker TypeScript runners remain development dependencies, not runtime dependencies.
- async settlement remains blocked until every required worker is fresh.
