# Worker lease and heartbeat validation — 2026-08-17

This pass hardens long-running background work across bridge, claims, and service-fee verification.

- Workers start a periodic non-overlapping database heartbeat in addition to the normal per-tick heartbeat.
- `POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS` is configurable and bounded.
- Every claimed bridge/claim/fee job renews its persisted lease while the operation is running.
- Lease renewal is owner-qualified; another worker cannot extend a lease it does not own.
- Lost ownership fails closed.
- Existing retry/reconciliation logic remains responsible for ambiguous external-chain outcomes; lease renewal never auto-resubmits transactions.
- `worker-lease-heartbeat:production:check` enforces the wiring across runtime, backend queues, workers, and environment templates.
