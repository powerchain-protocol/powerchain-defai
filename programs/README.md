# Solana Programs

Solana Anchor programs live under `programs/solana/`.

## PowerChain Bridge auxiliary program

Configured program ID:

```text
BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS
```

The program provides governed Bridge configuration and audit controls, including:

- `BridgeConfig` authority, pause state, nonce, and version.
- authority rotation with the executable program account rejected as signer authority.
- intent recording with amount, direction, destination, and non-zero quote-hash validation.
- separate information-commitment state bound to the canonical PWRC/wPWRC model.

Configure the governed signer with `POWERCHAIN_SOLANA_BRIDGE_AUTHORITY`; never set it to the program ID.

The program **does not** mint, burn, custody, lock, unlock, or settle PWRC/wPWRC principal. Wormhole NTT remains the sole cross-chain principal-movement protocol.

Repository configuration is not proof of deployment. Verify executable/program state on the intended Solana cluster before treating production deployment as verified.

See [`../docs/BRIDGE_AUTHORITY.md`](../docs/BRIDGE_AUTHORITY.md), [`../docs/REAL_NTT_BRIDGE.md`](../docs/REAL_NTT_BRIDGE.md), and [`../docs/TOKEN_INFORMATION_COMMITMENT.md`](../docs/TOKEN_INFORMATION_COMMITMENT.md).

## Intent validation upgrade

Bridge intent validation is factored into reusable program functions and mirrored by `@powerchain/bridge-core`. Existing config layouts remain stable. The programs emit version-2 observability context while Wormhole NTT remains the sole cross-chain principal movement protocol.
