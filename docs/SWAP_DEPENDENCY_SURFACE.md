# Swap dependency surface

PowerChain keeps swap runtime dependencies explicit at the workspace that owns the `/swap` application while keeping shared Solana/server tooling pinned at the private monorepo root.

## Swap application

`apps/bridge` owns the production `/swap` UI and route handlers. Its explicit swap client/runtime additions are:

- `@jup-ag/api` `6.0.48`
- `axios` `1.19.0`
- `bs58` `6.0.0`

Jupiter API availability does not grant signing or settlement authority. Wallet signatures remain user controlled and server-side swap metadata must still pass PowerChain intent/order validation.

## Root/shared tooling

The private root package pins:

- `@coral-xyz/anchor` `0.32.1`
- `@solana/kit` `7.1.0`
- `@solana/spl-token` `0.4.15`
- `@solana/spl-token-metadata` `0.1.6`
- `node-fetch` `3.3.2`
- `uuid` `14.0.1`
- `ws` `8.21.3`
- `zod` `4.4.3`

`@solana/web3.js` v1 remains in the existing compatibility surface. Adding `@solana/kit` does not silently migrate existing Web3.js/Anchor code to a different transaction model.

## Node built-ins and package naming

Do not add the npm package `fs`; Node 24 provides `node:fs` and `node:fs/promises` as built-ins.

The SPL metadata interface package is `@solana/spl-token-metadata`. PowerChain does not declare an `@solana/token-metadata` dependency.

## Cetus runtime compatibility

The default Node 24/25 workspace does not install `@cetusprotocol/aggregator-sdk` because its current dependency graph pulls a Node-24-only Hermes client. PowerChain uses a trusted remote Cetus adapter for quote and unsigned-transaction construction, keeping wallet signing in the application while preserving a clean install across the declared Node `>=24 <26` engine range.
