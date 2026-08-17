# Stablecoins, Pyth and RPC

PowerChain DeFAI supports Circle-issued USDC on Solana and Sui and Circle-issued EURC on Solana. EURC is not enabled on Sui unless Circle publishes a canonical Sui EURC deployment and the trusted-token policy is updated.

`apps/backend/src/services/currencies.ts` is the canonical currency registry. It maps SOL, SUI, PWRC, USDC and EURC to Pyth feed configuration. USDC has the stable Pyth Core USDC/USD feed ID as a default; EURC requires `POWERCHAIN_PYTH_EURC_USD_FEED_ID` so the application does not hard-code an unverified or stale identifier.

## Sui SDK ownership

PowerChain uses `@mysten/sui` for canonical Sui addresses, transactions and RPC clients. `shared/blockchain` pins the shared SDK version so backend and browser packages do not invent parallel Sui primitives. Production critical reads remain on the configured Sui Core API / gRPC failover pool.

`shared/blockchain/src/pyth-sui.ts` retrieves signed Pyth updates from Hermes REST v2 with HTTPS enforcement, bounded timeouts, feed-ID validation and server-side bearer authentication. PowerChain intentionally does not install `@pythnetwork/pyth-sui-js`; the canonical Sui runtime remains `@mysten/sui`, while signed oracle updates are fetched through authenticated Hermes REST v2. On-chain Pyth transaction construction remains feature-gated; Hermes updates are oracle input and are never authoritative for bridge finality.

Pyth state object IDs and Wormhole state object IDs are network-specific public deployment identifiers. They must be read from current Pyth deployment documentation when/if the on-chain update adapter is enabled; they are not invented or hard-coded in this repository.

`apps/backend/src/services/rpc.ts` is the canonical RPC service. Solana requests rotate across the configured primary and fallback endpoints. Sui critical reads remain on the gRPC/Core API with independent endpoint probing. RPC readiness and market observations are operational signals only and are not authoritative for Bridge accounting or Wormhole NTT reconciliation.

Environment variables:

```text
POWERCHAIN_SOLANA_USDC_MINT=
POWERCHAIN_SOLANA_EURC_MINT=
POWERCHAIN_SUI_USDC_COIN_TYPE=
POWERCHAIN_PYTH_HERMES_URL=https://pyth.dourolabs.app/hermes
POWERCHAIN_PYTH_API_KEY=
POWERCHAIN_PYTH_USDC_USD_FEED_ID=
POWERCHAIN_PYTH_EURC_USD_FEED_ID=
POWERCHAIN_RPC_TIMEOUT_MS=10000
```

## Pyth Sui signed-update API

`POST /api/v1/oracles/pyth/sui/updates` accepts one to sixteen normalized Pyth feed IDs and returns Hermes signed update payloads through the server-owned Pyth configuration. The route is rate-limited, does not expose the Pyth API key, does not sign a Sui transaction, and marks its response as non-authoritative for bridge finality.
