# Runtime Maintenance Freshness

PowerChain treats the persisted maintenance control as part of the production execution boundary. Workers must not wait indefinitely for the maintenance database read and must not assume that a failed read means the runtime is open for new work.

## Bounded reads

`POWERCHAIN_WORKER_MAINTENANCE_TIMEOUT_MS` controls the maximum maintenance-state read time. The default is `1500` ms and the accepted range is 250–10,000 ms.

If the read times out or fails, workers immediately fail closed:

- `draining = true`
- `source = database-unavailable`
- `readHealthy = false`
- no new queue item is claimed

The previous successful revision/timestamp may be retained only for operator diagnostics. It is never used to reopen execution after a failed read.

## Observable maintenance source

Operational and system readiness expose the maintenance source, revision, read-health state, read timestamp, last successful read timestamp, and cache age. This distinguishes an operator-requested drain from an emergency environment override or a fail-closed maintenance-store outage.

`POWERCHAIN_WORKER_DRAIN_MODE=true` remains the highest-priority emergency override.

## Idempotent mutations

A mutation with the expected revision, the same desired drain state, and the same normalized reason is a no-op. It does not create another revision solely because a deploy script repeated the same command. Genuine state or reason changes still advance the compare-and-swap revision and remain audit recorded.

Maintenance state never grants blockchain signing, retry, replay, settlement, or reconciliation authority.
