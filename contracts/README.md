# Contracts

Sui Move packages are under `contracts/sui/`. The `powerchain_bridge` package is
an auxiliary NTT guard/config package and emits transfer-intent events.

Wormhole NTT remains the sole cross-chain principal movement protocol.

The named address `0x0` is a publish-time placeholder and must never be treated
as a deployed package id.
