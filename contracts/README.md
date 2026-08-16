# Sui Contracts

Sui Move packages live under `contracts/sui/`.

`contracts/sui/powerchain_bridge` is an auxiliary configuration/authority/intent package for the Wormhole NTT Bridge lifecycle. It provides pause/authority controls, nonce sequencing, information-commitment binding, and validated intent events.

It does **not** create an independent mint, burn, custody, lock, unlock, or settlement path. Wormhole NTT remains the sole cross-chain principal movement protocol for PWRC/wPWRC.

Source named addresses intentionally remain fail-closed (for example `0x0`) until a real package is published and verified. Production package/object IDs must be supplied through verified deployment configuration rather than committed as invented source truth.

See [`sui/powerchain_bridge/README.md`](sui/powerchain_bridge/README.md), [`../docs/BRIDGE_AUTHORITY.md`](../docs/BRIDGE_AUTHORITY.md), and [`../docs/REAL_NTT_BRIDGE.md`](../docs/REAL_NTT_BRIDGE.md).

## Intent validation upgrade

Bridge intent validation is factored into reusable program functions and mirrored by `@powerchain/bridge-core`. Existing config layouts remain stable. The programs emit version-2 observability context while Wormhole NTT remains the sole cross-chain principal movement protocol.
