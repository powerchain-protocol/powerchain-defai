# Sui Contracts

Sui Move packages live under `contracts/sui/`.

`contracts/sui/powerchain_bridge` is an auxiliary configuration/authority/intent package for the Wormhole NTT Bridge lifecycle. It provides pause/authority controls, nonce sequencing, information-commitment binding, and validated intent events.

It does **not** create an independent mint, burn, custody, lock, unlock, or settlement path. Wormhole NTT remains the sole cross-chain principal movement protocol for PWRC/wPWRC.

Source named addresses intentionally remain fail-closed (for example `0x0`) until a real package is published and verified. Production package/object IDs must be supplied through verified deployment configuration rather than committed as invented source truth.

See [`sui/powerchain_bridge/README.md`](sui/powerchain_bridge/README.md), [`../docs/BRIDGE_AUTHORITY.md`](../docs/BRIDGE_AUTHORITY.md), and [`../docs/REAL_NTT_BRIDGE.md`](../docs/REAL_NTT_BRIDGE.md).

## Intent validation upgrade

Bridge intent validation is factored into reusable program functions and mirrored by `@powerchain/bridge-core`. Existing config layouts remain stable. The programs emit version-2 observability context while Wormhole NTT remains the sole cross-chain principal movement protocol.

## Runtime contract inventory

The Sui Bridge Guard is included in the read-only `/protocol` workspace. Runtime executable status requires configured package, bridge-config object, and information-commitment object evidence; source presence alone is not deployment proof.

The Move guard checks `BridgeConfig.version` before authority updates, pause changes, information-commitment creation, and intent recording. Wormhole NTT remains solely responsible for cross-chain principal settlement.

Protocol runtime verification also checks that the configured Sui package resolves as a package object and that the configured objects resolve to the expected `BridgeConfig` and `InformationCommitment` Move types for that package. Matching object IDs alone are insufficient.
