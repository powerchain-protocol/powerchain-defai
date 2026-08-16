# Runtime package boundaries

PowerChain DeFAI keeps cluster selection and provider endpoint derivation in shared server packages so transaction surfaces do not invent their own RPC policy.

## Next.js workspace compilation

The web runtime imports TypeScript source directly from the PowerChain workspaces. `apps/bridge/next.config.ts` therefore transpiles every source workspace consumed by the application: backend, database, runtime, protocol, blockchain, clusters, chat, and staking.

This is a build boundary, not only an optimization. Adding a source workspace import to the web application requires adding that workspace to `transpilePackages` unless it is published as precompiled JavaScript.

## Solana endpoint ownership

`apps/backend/src/config/endpoints.ts` owns Solana HTTP RPC and WebSocket endpoint derivation. The policy is cluster-aware:

- mainnet-beta may derive Helius mainnet endpoints from `HELIUS_API_KEY`;
- devnet may derive Helius devnet endpoints;
- testnet and localnet require explicit endpoints rather than inventing unsupported Helius hostnames;
- HTTP and WebSocket fallbacks use their respective ordered environment lists.

`apps/backend/src/services/rpc.ts` exposes the canonical normalized HTTP and WebSocket endpoint lists. Bridge provider health, public configuration, and Token-2022 inspection consume that service. A Bridge-local Helius/endpoint derivation module is forbidden.

## Cross-chain normalization

Bridge configuration uses `@powerchain/blockchain` for Sui normalization and Solana/Sui direction pairing. This keeps address and route semantics aligned with Swap, payer validation, clusters, and public blockchain APIs.

These runtime/provider surfaces remain operational infrastructure. They do not replace Wormhole NTT finality or reconciliation evidence for PWRC/wPWRC principal movement.
