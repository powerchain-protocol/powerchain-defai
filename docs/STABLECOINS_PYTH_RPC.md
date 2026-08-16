# Stablecoins, Pyth and RPC

PowerChain DeFAI supports Circle-issued USDC on Solana and Sui and Circle-issued EURC on Solana. EURC is not enabled on Sui because Circle does not currently list Sui as an EURC network.

`apps/backend/src/services/currencies.ts` is the canonical currency registry. It maps SOL, SUI, PWRC, USDC and EURC to Pyth feed configuration. USDC has the stable Pyth Core USDC/USD feed ID as a default; EURC requires `POWERCHAIN_PYTH_EURC_USD_FEED_ID` so the application does not hard-code an unverified or stale identifier.

`apps/backend/src/services/rpc.ts` is the canonical RPC service. Solana requests rotate across the configured primary and fallback endpoints. Sui critical reads remain on the gRPC/Core API with independent endpoint probing. RPC readiness and market observations are operational signals only and are not authoritative for Bridge accounting or Wormhole NTT reconciliation.

Environment variables:

```text
POWERCHAIN_SOLANA_USDC_MINT=
POWERCHAIN_SOLANA_EURC_MINT=
POWERCHAIN_SUI_USDC_COIN_TYPE=
POWERCHAIN_PYTH_USDC_USD_FEED_ID=
POWERCHAIN_PYTH_EURC_USD_FEED_ID=
POWERCHAIN_RPC_TIMEOUT_MS=10000
```
