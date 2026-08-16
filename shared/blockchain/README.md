# @powerchain/blockchain

Shared Solana/Sui blockchain primitives for PowerChain DeFAI.

This package owns canonical chain identifiers, address normalization/validation, Sui coin-type validation, and the supported cross-chain Bridge directions:

```text
SUI_TO_SOLANA
SOLANA_TO_SUI
```

Same-chain activity belongs to Swap/liquidity flows rather than the Bridge route model.

See [`../../docs/CROSS_CHAIN_CLUSTERS.md`](../../docs/CROSS_CHAIN_CLUSTERS.md).
