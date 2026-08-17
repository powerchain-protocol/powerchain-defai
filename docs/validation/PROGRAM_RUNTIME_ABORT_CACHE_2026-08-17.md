# Program runtime abort/cache validation — 2026-08-17

Validated source-level production invariants for Protocol program verification:

- verifier deadlines abort underlying supported RPC/fetch work;
- Solana Bridge and Sui Bridge receive the deadline signal;
- Solana staking verification propagates cancellation through RPC requests;
- Solana escrow runtime verification propagates cancellation through RPC requests;
- program evidence cache entries are bound to runtime deployment fingerprints;
- cache entries are invalidated on fingerprint change;
- stale in-flight results cannot populate the cache after configuration changes.

This validation does not replace dependency-installed builds, live RPC tests, Anchor/Cargo builds, or deployed-chain verification.
