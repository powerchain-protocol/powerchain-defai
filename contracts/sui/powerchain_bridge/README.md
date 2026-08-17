# PowerChain Sui Bridge Auxiliary Package

This Move package provides PowerChain Bridge configuration, authority/pause controls, information-commitment binding, nonce sequencing, and validated intent events.

It does **not** custody, mint, burn, lock, unlock, or settle PWRC/wPWRC principal. Wormhole NTT remains the sole cross-chain principal-movement protocol.

## Source target

`Move.toml` intentionally keeps:

```toml
[addresses]
powerchain_bridge = "0x0"
```

Do not replace that source alias with an invented or environment-specific package ID.

After a governed publish and independent verification, configure:

```text
POWERCHAIN_SUI_BRIDGE_PACKAGE_ID=
POWERCHAIN_SUI_BRIDGE_CONFIG_OBJECT_ID=
POWERCHAIN_SUI_BRIDGE_AUTHORITY=
POWERCHAIN_SUI_INFORMATION_COMMITMENT_OBJECT_ID=
```

Application targets are composed by `@powerchain/backend/bridge/sui-targets`, which normalizes the verified package address and allows only the supported `powerchain_bridge` entry functions.

## Validation

Use the intended Sui CLI/toolchain to build and test the package, then run repository source checks:

```bash
pnpm sui-bridge:production:check
pnpm protocol:check
```

`pnpm protocol:sync` must only be used with verified deployment identifiers; it does not turn an unverified package ID into source truth.

## Intent validation upgrade

Bridge intent validation is factored into reusable program functions and mirrored by `@powerchain/bridge-core`. Existing config layouts remain stable. The programs emit version-2 observability context while Wormhole NTT remains the sole cross-chain principal movement protocol.

## Runtime deployment evidence

The application runtime verifier requires the configured package to resolve as a package object and both canonical guard objects to match the expected Move types. Because the module creates `BridgeConfig` and `InformationCommitment` with `transfer::share_object`, runtime verification also requires both configured object IDs to resolve as shared objects. A matching object ID/type with an unexpected ownership mode remains gated.
