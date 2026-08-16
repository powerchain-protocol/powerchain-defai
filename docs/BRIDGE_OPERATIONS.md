# Bridge operations and runtime

PowerChain Bridge 1.0.0 uses Wormhole NTT for cross-chain PWRC/wPWRC principal movement and keeps auxiliary Solana/Sui programs limited to configuration, authorization, pause, nonce, intent, and audit responsibilities.

## Default route

The default user flow is:

```text
Sui wPWRC → Solana PWRC
```

The reverse route remains supported:

```text
Solana PWRC → Sui wPWRC
```

Principal conversion is 1:1. Service fees and native network gas remain separate.

## Auxiliary programs

### Solana

Program ID:

```text
BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS
```

The `BridgeConfig` PDA owns the configured authority, pause state, version, and operation nonce. Supported auxiliary instructions are `initialize_config`, `set_authority`, `set_paused`, and `record_intent`.

### Sui

The Sui package ID is not invented by source code. Configure a verified deployment through `POWERCHAIN_SUI_BRIDGE_PACKAGE_ID`, then configure the shared `BridgeConfig` object and authority through `POWERCHAIN_SUI_BRIDGE_CONFIG_OBJECT_ID` and `POWERCHAIN_SUI_BRIDGE_AUTHORITY`.

The Sui package mirrors the auxiliary authority/pause/version/nonce model and binds each recorded intent to a 32-byte quote commitment.

## Operation lifecycle

The persisted bridge worker advances an operation through source submission, source finality, Wormhole NTT observation, destination submission/finality, fee verification, reconciliation, and completion. Every state transition is written with a database audit event in the same transaction as the state update.

A destination mismatch or incomplete finality evidence enters reconciliation instead of being marked complete. Unknown submission outcomes are not blindly resubmitted.

## API

Browser-safe configuration:

```text
GET /api/v1/bridge/config
GET /api/v1/bridge/routes
GET /api/v1/bridge/runtime
```

Transfer operations:

```text
POST /api/v1/bridge/quote
POST /api/v1/bridge/transfers
POST /api/v1/bridge/transfers/:id/source
GET  /api/v1/bridge/transfers/:id
GET  /api/v1/bridge/transfers/:id/events
GET  /api/v1/bridge/transfers/:id/events/stream
```

The public config API exposes counts and public program/package/NTT identifiers only. It does not return secret RPC credentials.

## Endpoint pools

### Solana HTTP RPC

```text
POWERCHAIN_SOLANA_RPC_URL
POWERCHAIN_SOLANA_RPC_FALLBACK_URL
POWERCHAIN_SOLANA_RPC_FALLBACK_URLS
```

Finality verification and service-fee verification fail over across the ordered pool.

### Solana WebSocket

```text
POWERCHAIN_SOLANA_WS_URL
POWERCHAIN_SOLANA_WS_FALLBACK_URL
POWERCHAIN_SOLANA_WS_FALLBACK_URLS
```

These values provide chain-level WebSocket topology for consumers that need Solana subscriptions. Application transfer-status realtime is configured separately.

### Sui gRPC

```text
POWERCHAIN_SUI_GRPC_URL
POWERCHAIN_SUI_GRPC_FALLBACK_URL
POWERCHAIN_SUI_GRPC_FALLBACK_URLS
```

Blocking bridge runtime checks, wPWRC balance reads, Sui transaction finality, and Sui service-fee verification use the gRPC/Core API path with ordered failover. Legacy Sui JSON-RPC variables are retained only as migration compatibility inputs where explicitly documented.

## Application realtime

```text
NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_URL
NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URL
NEXT_PUBLIC_POWERCHAIN_REALTIME_WS_FALLBACK_URLS
```

Transfer-status clients rotate WebSocket endpoints on reconnect. When WebSocket delivery is unavailable, the client falls back to the persisted SSE stream and then cursor-based polling. All three transports read the same persisted transfer/audit state, so transport failover does not change the source of truth.

## Production invariants

- Wormhole NTT remains the sole cross-chain principal movement protocol.
- Auxiliary program/package identities and authorities fail closed when required configuration is absent.
- The Solana executable program ID is never reused as the signer authority.
- Sui package/config object IDs are never fabricated.
- Completion requires independent chain finality and NTT reconciliation evidence.
- Realtime delivery is informational; persisted database and chain reconciliation state is authoritative.
