# Operations hardening

PowerChain Bridge 1.0.0 now hard-bounds worker ticks, fails closed after an unknown timed-out tick, and checks `AbortSignal` between claimed jobs. This prevents a second worker iteration from overlapping work whose outcome is unknown.

Prisma 7 uses the PostgreSQL driver adapter pool. The repository configures bounded pool size, connection timeout, idle timeout and application name through environment variables.

`GET /api/v1/workers/readiness` returns only aggregate claim/fee worker freshness. Worker instance IDs are intentionally not exposed. This endpoint is separate from web `/api/v1/ready` so independent worker deployments do not block the web service deployment probe.
