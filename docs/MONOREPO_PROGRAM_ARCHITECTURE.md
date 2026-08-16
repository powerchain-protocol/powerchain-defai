# Monorepo and program architecture

PowerChain DeFAI keeps transaction-domain logic separated while sharing deterministic bridge intent rules.

## Ownership

- `packages/bridge-core` owns off-chain bridge intent constants, direction codes, destination normalization, amount bounds, and quote-commitment validation.
- `apps/backend` consumes those rules when building auxiliary program operations.
- `programs/solana/powerchain_bridge` mirrors the same guard rules in Anchor.
- `contracts/sui/powerchain_bridge` mirrors the same guard rules in Move.
- Wormhole NTT remains the sole cross-chain principal movement protocol.

## Program compatibility

Existing BridgeConfig account/object layouts remain unchanged. Program improvements factor validation into reusable functions and emit version-2 observability events in addition to the existing intent event. The Solana V2 event adds slot and Unix timestamp; the Sui V2 event adds epoch context.

The information commitment assertion also checks the commitment version before accepting the canonical digest.

## Non-goals

The auxiliary programs do not mint, burn, custody, lock, unlock, or settle PWRC/wPWRC principal.
