# Backend operations and transaction services

PowerChain DeFAI keeps one authoritative backend package at `apps/backend`. Browser routes and worker processes consume that package through stable exports instead of reimplementing database queries or worker lifecycle logic.

## Transaction ownership

`apps/backend/src/services/transactions.ts` owns bridge-history status parsing, pagination bounds, database queries, transaction normalization, and explorer/finality wording. Both the `/history` server page and `GET /api/v1/bridge/history` use this service.

This prevents the page and API from drifting into different status sets, pagination behavior, or query semantics. Explorer/indexer visibility remains informational and does not replace finalized RPC evidence or Wormhole NTT reconciliation.

## Worker lifecycle

Worker runtime policy is owned by `apps/backend/src/workers/`:

- `config.ts` bounds worker IDs, polling intervals, leases, and batch sizes.
- `heartbeat.ts` owns persisted worker heartbeat creation and removal.
- worker process apps remain thin supervisors and do not duplicate heartbeat persistence logic.

A worker heartbeat indicates process freshness only. It does not prove that a transfer, claim, or fee settlement is complete.

## Operational readiness

`apps/backend/src/services/operations.ts` combines three evidence sources:

1. database readiness;
2. latest persisted worker heartbeats;
3. bounded queue counts for bridge transfers, claims, and fee settlements.

`GET /api/v1/operations/status` exposes a browser-safe snapshot with `healthy`, `degraded`, or `blocked` state.

Queue categories are intentionally operational:

- `pending` means work is still active or retryable;
- `attention` means failed, unknown, reconciliation-required, or manual-review state.

The endpoint declares `authoritativeForBridgeAccounting: false`. It is an operational dashboard surface, not bridge accounting evidence.

## UI behavior

The Integrations page renders the operational snapshot alongside provider integrations. The card:

- refreshes only while the tab is visible and online;
- cancels superseded requests;
- retains the last successful snapshot when a refresh fails;
- never displays worker IDs, provider URLs, credentials, or secrets.

The History page now consumes the backend transaction service directly and labels its summary counts as page-local rather than pretending they are global protocol metrics.

## Trust boundary

Operational readiness, explorer visibility, AI guidance, DEX routing, and indexer data cannot finalize a bridge transfer. PWRC/wPWRC cross-chain principal movement remains Wormhole NTT-only, with finality and persisted reconciliation required by the bridge worker.
