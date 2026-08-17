# Programs and Contracts Runtime

PowerChain keeps source code, operator configuration, and live deployment evidence separate.

- `/protocol` is a light-first, dark-capable read-only application surface.
- `GET /api/v1/programs/readiness` aggregates source inventory and runtime verification.
- `GET /api/v1/programs/readiness/:programId` re-verifies one allowlisted program without making the aggregate surface depend on optional verifier success.
- Every runtime item includes its own `checkedAt` and `verificationDurationMs`; unexpected verifier exceptions degrade only that program to `unavailable`.
- `@powerchain/protocol/programs` defines source-controlled program metadata only.
- Solana Bridge readiness verifies the executable program account through the configured RPC pool.
- Solana Staking reuses the staking verifier, including program/config/vault/reward evidence.
- Solana Escrow reuses executable-program verification and keeps checkout-level account verification separate.
- Sui Bridge readiness requires the configured package, bridge config object, and information-commitment object to be present through one runtime RPC path.

## Safety boundaries

Repository presence does not prove deployment. `UNSET`, missing objects, stale provider evidence, and RPC failures remain gated or unavailable. The program inventory is not authoritative for bridge settlement, balances, staking rewards, or transaction finality. Wormhole NTT remains the principal bridge settlement protocol.

Both Solana and Sui auxiliary bridge guards enforce their config version before authority, pause, or intent-recording operations. This prevents a stale/incompatible configuration version from continuing privileged guard execution.

## Core readiness semantics

The two auxiliary bridge guards are marked `requiredForCoreBridge`. The aggregate `ready` field only becomes true when those required Solana and Sui bridge deployments are both runtime-verified and executable. Staking and escrow are tracked as optional product programs; leaving them unconfigured does not fabricate deployment readiness and does not make them executable.

Sui verification checks more than object IDs: the package must be returned as a package object and the configured bridge/configuration objects must resolve to the expected `BridgeConfig` and `InformationCommitment` Move types for that package.
