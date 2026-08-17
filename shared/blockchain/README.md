# @powerchain/blockchain

Shared Solana/Sui blockchain primitives for PowerChain DeFAI.

This package owns canonical chain identifiers, address normalization/validation, Sui coin-type validation, the common `@mysten/sui` surface, Pyth Sui Hermes signed-update helpers, and the supported cross-chain Bridge directions:

```text
SUI_TO_SOLANA
SOLANA_TO_SUI
```

Sui RPC and transaction ownership remains on `@mysten/sui`. `./pyth-sui` retrieves signed Pyth updates directly from the authenticated Hermes REST v2 API using the platform fetch runtime. `@pythnetwork/pyth-sui-js` is intentionally not installed: PowerChain keeps one canonical Sui SDK (`@mysten/sui`) and retrieves Pyth signed updates through the Hermes REST boundary.

Same-chain activity belongs to Swap/liquidity flows rather than the Bridge route model.

See [`../../docs/CROSS_CHAIN_CLUSTERS.md`](../../docs/CROSS_CHAIN_CLUSTERS.md) and [`../../docs/STABLECOINS_PYTH_RPC.md`](../../docs/STABLECOINS_PYTH_RPC.md).
