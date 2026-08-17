# Real Wormhole NTT bridge execution

PowerChain Bridge uses wallet-signed Wormhole NTT transactions. The browser never receives a server signing key.

## Default direction

The UI and public route configuration default to **Sui wPWRC → Solana PWRC**. The reverse Solana PWRC → Sui wPWRC path remains supported. The default affects presentation/route selection only; it does not bypass quote, wallet-signature, NTT, finality, fee, or reconciliation checks.

## Lifecycle

1. Server issues a quote bound to direction, principal, fee, wallets, runtime snapshot and expiry.
2. The user signs the reviewed NTT execution surface source-chain transaction.
3. The source transaction hash is attached to the persisted transfer.
4. `@powerchain/worker-bridge` independently verifies source-chain finality, expected NTT manager invocation, source signer and PWRC/wPWRC debit.
5. The worker finds the matching Wormholescan NTT operation and validates source/destination Wormhole chain IDs, exact normalized principal and destination wallet.
6. When an Executor redemption appears, the worker independently verifies destination-chain finality, manager invocation and recipient credit.
7. Completion requires verified service-fee settlement and a fresh exact NTT reconciliation.
8. Evidence mismatches enter `RECONCILIATION_REQUIRED`; unknown blockchain outcomes are not blindly resubmitted.

## Auxiliary Solana program

The configured PowerChain auxiliary Anchor program ID is `BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS`. Its governed signer authority is configured separately through `POWERCHAIN_SOLANA_BRIDGE_AUTHORITY` and enforced by the program `BridgeConfig` PDA. The program account cannot be used as the authority signer.

This auxiliary program remains outside the Wormhole NTT principal-movement path. The companion Sui package follows the same authority/pause/nonce intent-recording boundary and also does not move principal.

## Required deployment values

`POWERCHAIN_NTT_SOLANA_MANAGER`, `POWERCHAIN_NTT_SOLANA_EMITTER`, `POWERCHAIN_NTT_SUI_MANAGER`, and `POWERCHAIN_NTT_SUI_EMITTER` must contain the real deployed NTT identifiers. They are intentionally not invented by the repository.

## Realtime status delivery

Transfer progress is sourced from persisted bridge state and audit events. Browser delivery uses application WebSocket endpoints with reconnect rotation, then `/events/stream` SSE, then cursor-based `/events` polling. A realtime transport outage therefore does not change reconciliation or completion authority.
