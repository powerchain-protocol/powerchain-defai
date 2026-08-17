# Worker leases and heartbeats

PowerChain uses three asynchronous workers: bridge, claims, and fees. Worker heartbeats and per-job leases solve different problems and must remain independent.

## Heartbeats

Each worker records an immediate heartbeat at startup and refreshes it in the background while the process is alive. `POWERCHAIN_WORKER_HEARTBEAT_INTERVAL_MS` defaults to 15 seconds and is bounded to 5–60 seconds.

The normal readiness maximum age remains a separate setting. A long RPC verification therefore no longer makes a healthy worker appear stale simply because the current batch has not returned to its outer loop.

A heartbeat is process-liveness evidence only. It is not transaction finality, queue completion, balance evidence, or settlement authority.

## Job leases

Bridge transfers, claim payouts, and service-fee verification records are claimed with persisted ownership leases. A worker renews the lease while a job is still running so a second replica cannot legitimately reclaim the same work merely because a single RPC operation lasts longer than the original lease window.

Lease renewal verifies the current worker remains the recorded owner. If ownership has already been lost, the supervised job fails closed with `POWERCHAIN_WORKER_LEASE_LOST` rather than treating the operation as successfully owned.

Lease renewal does not create transaction retry authority. Chain submission code must remain independently idempotent and reconciliation-aware because a network timeout can always make the final external state ambiguous.

## Shutdown and recovery

SIGINT/SIGTERM abort the supervised worker loop. Persisted leases eventually expire if a process dies before cleanup, allowing another replica to recover the work. Normal completed/retried work clears its lease explicitly.

Do not reduce lease durations below the realistic RPC operation time unless renewal is retained and tested.
