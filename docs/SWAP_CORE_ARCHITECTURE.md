# Swap Core Architecture

`@powerchain/swap-core` is the provider-neutral transaction contract shared by the Solana and Sui swap paths.

## Ownership

Swap Core owns canonical payer and asset normalization, positive base-unit validation, slippage bounds, minimum-output math, the 2.5% PowerChain fee constant, quote freshness, price-protection checks, and allowed execution-state transitions.

Provider adapters remain separate:

- Jupiter builds and executes wallet-signed Solana swaps.
- Cetus builds wallet-signed Sui swaps.
- Raydium, Meteora, and Orca remain routing/liquidity observations unless an explicitly reviewed execution adapter is enabled.

## Safety boundary

All financial math uses integer base units. Swap Core never stores private keys, never signs transactions, never asserts bridge finality, and is not authoritative for bridge accounting. The connected wallet remains the payer and signer.

A provider quote must pass canonical validation before it is persisted or presented for review. A fresh output below the protected minimum fails with `SWAP_PRICE_PROTECTION_TRIGGERED`.

## State model

The canonical state progression is intentionally bounded:

`idle → quoting → review → awaiting-signature → submitted → confirmed`

Failure and retry transitions are explicit. UI components may render richer presentation states, but they must not skip the wallet-signature boundary.
