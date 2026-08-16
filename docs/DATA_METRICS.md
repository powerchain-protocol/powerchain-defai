# Data and Metrics

PowerChain Bridge keeps reusable client-safe bridge metadata in `apps/bridge/lib/data/data.ts` and persisted operational metric aggregation in `apps/bridge/server/services/metrics.ts`.

## Canonical data

`data.ts` owns the supported bridge directions and persisted transfer-status vocabulary used by the UI. It also provides runtime validation for the public metrics payload so API data remains `unknown` until validated.

The default route remains Sui wPWRC to Solana PWRC. The reverse route is represented separately and remains available only when the configured Wormhole NTT deployment supports it.

## Persisted metrics

`metrics.ts` is server-only and reads `BridgeTransfer` records through Prisma. It exposes operational summaries such as total, active, completed and failed transfers, reconciliation-required operations, selectable time-window activity, exact principal base-unit totals and bounded lifecycle timing samples.

The dashboard supports 24-hour, 7-day, and 30-day views. Direction counts distinguish Sui wPWRC → Solana PWRC from Solana PWRC → Sui wPWRC. Selected-window completed principal is calculated from persisted completed transfers only.

Lifecycle timing is derived from persisted timestamps rather than estimates:

- transfer creation → source finality;
- source finality → Wormhole NTT message observation;
- NTT observation → destination finality;
- transfer creation → terminal completion for completed operations.

Rows missing a lifecycle timestamp are excluded from that stage's timing sample.

The terminal completion ratio is computed only from persisted terminal states (`COMPLETED` and `FAILED`). It is not an availability SLA or a prediction of future bridge success.

## API

`GET /api/v1/metrics/bridge?windowHours=24` returns a no-store snapshot. The query window is strictly validated as an integer from 1–720 hours; invalid explicit values fail with `400 BRIDGE_METRICS_WINDOW_INVALID` instead of silently changing the requested window.

The response explicitly declares `authoritativeForBridgeAccounting: false`. Metrics must not be used as proof of source finality, Wormhole NTT observation, destination finality or reconciliation. The canonical transfer record and its verification evidence remain authoritative.

## UI rules

The Bridge dashboard may display database-backed counts, direction breakdowns, principal totals and lifecycle timing summaries. It must not invent TVL, TPS, transaction volume, uptime, success-rate targets or settlement guarantees when those values are not backed by persisted evidence.

Metrics refresh is abort-safe, timeout-bounded, visibility-aware and offline-aware. If a refresh fails after a successful snapshot, the UI keeps the last validated snapshot and marks it as stale.

## Database indexes

Bridge metrics windows are supported by dedicated `bridge_transfers(created_at)` and `bridge_transfers(direction, created_at)` indexes. The Prisma migration is mirrored byte-for-byte under `supabase/migrations/` so both migration paths remain aligned.
