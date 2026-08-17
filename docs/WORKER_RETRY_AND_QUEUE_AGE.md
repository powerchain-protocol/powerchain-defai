# Worker retry, manual reconciliation, and queue age

PowerChain workers distinguish automatic retry work from operator-attention states.

## Bridge retry policy

`RECONCILIATION_REQUIRED` is a manual-attention state. It is deliberately excluded from the bridge worker's automatic claim set. A transfer in that state is never reclaimed merely because `bridgeNextRetryAt` is null.

Transient bridge failures use bounded exponential retry. `POWERCHAIN_BRIDGE_MAX_ATTEMPTS` defaults to `25` and is bounded by the runtime policy. When the retry budget is exhausted, or when a failure is classified as an invariant/configuration mismatch, the transfer moves to `RECONCILIATION_REQUIRED`, clears its lease and retry timestamp, and emits a `bridge.manual-review` audit event.

This state does not assert that funds were lost or that a chain transaction failed. It means automatic progression has stopped and evidence must be reconciled before another action is authorized.

## Queue-age pressure

Queue health uses both backlog count and age of the oldest pending record. Defaults:

```env
POWERCHAIN_QUEUE_BACKLOG_ELEVATED=500
POWERCHAIN_QUEUE_BACKLOG_HIGH=2000
POWERCHAIN_QUEUE_AGE_ELEVATED_MS=300000
POWERCHAIN_QUEUE_AGE_HIGH_MS=1800000
```

A small queue can therefore become `elevated` or `high` when work is stale. High queue pressure keeps aggregate `asyncSettlement` readiness disabled even if worker heartbeats are fresh.

## Safety boundary

Retry classification, worker leases, and queue readiness never authorize a blockchain replay. Ambiguous submissions remain under the existing idempotency and reconciliation paths.
