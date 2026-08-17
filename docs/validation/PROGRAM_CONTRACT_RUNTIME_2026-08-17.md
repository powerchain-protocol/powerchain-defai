# Program and Contract Runtime Validation — 2026-08-17

This pass connects source-controlled PowerChain programs/contracts to a runtime evidence surface without converting repository metadata into deployment claims.

- Added `@powerchain/protocol/programs` source inventory.
- Added `/protocol` and `/api/v1/programs/readiness`.
- Solana Bridge, Staking and Escrow use their runtime verification paths.
- Sui Bridge requires package/config/information object evidence before executable status.
- Solana and Sui auxiliary bridge guards reject incompatible config versions before privileged operations.
- Wormhole NTT remains principal bridge settlement authority.
- The Protocol UI is read-only, light-first and dark-capable.
