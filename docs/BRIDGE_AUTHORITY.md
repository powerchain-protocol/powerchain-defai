# Bridge programs and authority

## Program ID

PowerChain Bridge is configured with the following Solana auxiliary Anchor program ID:

```text
BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS
```

This value is stored in `POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID`, `programs/solana/Anchor.toml`, and the program `declare_id!` declaration.

The repository treats the value as configured deployment metadata. Production release verification must independently confirm that the address is the intended executable program on the target Solana cluster.

## Bridge authority

The signer authority is intentionally separate from the executable program account. Configure it with:

```text
POWERCHAIN_SOLANA_BRIDGE_AUTHORITY=<authorized-signer-wallet>
```

The authority wallet must not equal the program ID.

The Anchor program persists authority state in the PDA derived from:

```text
bridge-config
```

`initialize_config` sets the initial authority, `record_intent` requires that configured signer, and `set_authority` rotates authority only when the current authority signs. `set_paused` provides an emergency intent-recording stop, while `next_nonce` prevents operation-sequence reuse. Authority and pause changes emit audit events for indexing.

## Security invariant

This authority controls only the auxiliary PowerChain intent/audit program. Wormhole NTT remains the sole protocol responsible for cross-chain principal movement. The auxiliary authority must not be treated as an independent mint, burn, lock, unlock, or settlement authority.

## Sui auxiliary package

The Sui package identity remains fail-closed until a verified package ID is configured with `POWERCHAIN_SUI_BRIDGE_PACKAGE_ID`. The shared `BridgeConfig` object is configured separately through `POWERCHAIN_SUI_BRIDGE_CONFIG_OBJECT_ID`, and its governed signer address is configured with `POWERCHAIN_SUI_BRIDGE_AUTHORITY`.

The Sui `BridgeConfig` stores authority, pause state, version, and monotonic `next_nonce`. `set_authority` rotates governance, `set_paused` blocks new auxiliary intent recording during an incident, and `record_intent` requires the active authority plus a 32-byte quote commitment.

Neither the Solana nor Sui auxiliary program owns PWRC/wPWRC principal custody. They record and guard operation intent around the NTT flow.
