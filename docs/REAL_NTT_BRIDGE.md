# Real Wormhole NTT bridge execution

PowerChain Bridge uses wallet-signed Wormhole NTT transactions. The browser never receives a server signing key.

## Lifecycle

1. Server issues a quote bound to direction, principal, fee, wallets, runtime snapshot and expiry.
2. The user signs the configured NTT Executor/Connect source-chain transaction.
3. The source transaction hash is attached to the persisted transfer.
4. `@powerchain/worker-bridge` independently verifies source-chain finality, expected NTT manager invocation, source signer and PWRC/wPWRC debit.
5. The worker finds the matching Wormholescan NTT operation and validates source/destination Wormhole chain IDs, exact normalized principal and destination wallet.
6. When an Executor redemption appears, the worker independently verifies destination-chain finality, manager invocation and recipient credit.
7. Completion requires verified service-fee settlement and a fresh exact NTT reconciliation.
8. Evidence mismatches enter `RECONCILIATION_REQUIRED`; unknown blockchain outcomes are not blindly resubmitted.

## Required deployment values

`POWERCHAIN_NTT_SOLANA_MANAGER`, `POWERCHAIN_NTT_SOLANA_EMITTER`, `POWERCHAIN_NTT_SUI_MANAGER`, and `POWERCHAIN_NTT_SUI_EMITTER` must contain the real deployed NTT identifiers. They are intentionally not invented by the repository.
