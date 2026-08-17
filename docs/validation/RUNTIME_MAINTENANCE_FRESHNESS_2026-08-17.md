# Runtime maintenance freshness validation — 2026-08-17

Validated source invariants:

- persisted worker maintenance reads are bounded by a configurable timeout;
- read failure/timeouts force drain mode instead of permitting queue claims;
- readiness contracts distinguish database, environment-override, and database-unavailable maintenance sources;
- blocked readiness fallbacks are schema-valid and fail closed;
- repeated identical maintenance mutations are idempotent no-ops;
- the emergency environment override remains one-way force-drain behavior.

This validation is source-level and does not replace a live database timeout/failover exercise in the deployment environment.
