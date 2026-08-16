# Hooks and runtime resilience

PowerChain DeFAI keeps provider/readiness hooks, operation recovery, and realtime transport behavior strict under React 19 and `exactOptionalPropertyTypes`.

## React state initialization

Provider hooks initialize optional state explicitly with `undefined` instead of relying on parameterless generic `useState<T>()` calls. This avoids React 19 type-definition drift and keeps state setters correctly typed as `T | undefined`.

## Provider health and readiness

`useProviderHealth()` and `useProviderReadiness()` share bounded refresh timing from `apps/bridge/constants/provider-runtime.ts`.

Both hooks:

- abort superseded requests;
- ignore stale request generations;
- refresh only while the document is visible and the browser is online;
- distinguish first load from background refresh;
- retain the last successful snapshot;
- expose stale/offline state instead of pretending cached data is live.

Provider readiness is evidence about configured runtime dependencies only. It is not Bridge finality or accounting evidence.

## Operation journal optional fields

`OperationJournalMessage` and persisted operation records obey `exactOptionalPropertyTypes`. Optional fields are omitted when absent rather than emitted as `undefined`.

This applies to:

- cross-tab `clear` messages;
- parsed operation records;
- server observations;
- terminal timestamps;
- server revision/snapshot metadata.

The canonical journal remains `powerchain.operation-journal` and older suffixed keys are import-only migration aliases.

## WebSocket fallbacks

Bridge realtime transport remains:

```text
WebSocket endpoints in priority order
  -> SSE
  -> cursor-based polling
```

Public reconnect and heartbeat intervals are bounded through:

```text
NEXT_PUBLIC_POWERCHAIN_WS_RECONNECT_INTERVAL
NEXT_PUBLIC_POWERCHAIN_WS_HEARTBEAT_INTERVAL
```

A failed WebSocket endpoint rotates to the next configured endpoint before the transport falls back to SSE. Realtime transport remains informational; persisted transfer state is authoritative.

## Backend endpoint pools

The canonical backend endpoint configuration removes duplicate fallback URLs and never repeats the primary URL inside its fallback set. Solana HTTP, Solana WebSocket, and Sui gRPC pools all use this rule.

## Staking boundary

`@powerchain/staking` remains deployment-gated and fail-closed. It must not fabricate APR, reward rates, pool state, or deployment availability, and the connected wallet remains the signing authority.
