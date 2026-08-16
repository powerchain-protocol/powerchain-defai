# Bridge and Swap API separation

PowerChain DeFAI exposes Bridge and Swap as independent transaction API domains.

## Bridge API

Runtime namespace: `/api/v1/bridge/*`. Its router policy, SDK client, OpenAPI contract, and Postman collection are owned independently. Wormhole NTT remains the sole PWRC/wPWRC cross-chain principal mover.

## Swap API

Runtime namespace: `/api/v1/swap/*`. Solana uses Jupiter wallet-owned execution and Sui uses Cetus wallet-owned execution. Swap APIs cannot mark a Bridge transfer finalized or reconciled.

## Shared infrastructure

Both APIs may consume shared currencies, trusted tokens, RPC/gRPC, clusters, request security, calculators, prices/rates, and wallet-address validation. Shared infrastructure does not merge their transaction state machines.

## Contracts

- Combined: `/api/v1/openapi`, `api/swagger.yaml`
- Bridge: `/api/v1/bridge/openapi`, `api/bridge/openapi.yaml`
- Swap: `/api/v1/swap/openapi`, `api/swap/openapi.yaml`

The SDK mirrors this boundary through `client.bridge` and `client.swap`.

## Production Postman hosts

The generated production Postman environment keeps the API domains separate:

- shared DeFAI API: `https://powerchain.app`
- Swap API: `https://swap.powerchain.app`
- Bridge API: `https://bridge.powerchain.app`

The combined collection selects the correct variable from the request namespace; the split Bridge and Swap collections default directly to their respective production hosts.
