# System readiness validation — 2026-08-17

This pass adds a fail-closed aggregate production-readiness contract.

Validated source invariants:

- database, provider readiness, worker heartbeat/queue evidence and route-policy pressure are aggregated;
- database/provider failure blocks new operations and returns HTTP 503;
- worker or redundancy degradation does not masquerade as fully ready;
- readiness payloads are explicitly non-authoritative for balances and settlement;
- client polling is abortable, generation-safe, online/visibility aware and bounded;
- Runtime Status renders the aggregate capability envelope;
- a post-deploy smoke script checks health/readiness without signing or submitting transactions.
