# Transaction and data architecture

PowerChain DeFAI 1.0.0 uses shared transaction UI, Swap Core slippage rules, and durable database snapshots.

## Transaction UX

`completed.tsx`, `messages.tsx`, and `confirmations.tsx` distinguish prepared, submitted, confirmed, failed, and bridge-finality states. Explorer submission is informational and is not Bridge settlement evidence.

## Data ownership

`SwapExecution` stores durable swap lifecycle records. `WalletBalanceSnapshot` stores non-authoritative portfolio observations. Pool observations remain in `DexPoolSnapshot`; LP state remains in `LiquidityPosition`.

Wallet balance and portfolio snapshots are never authoritative for Bridge accounting. The connected wallet remains the signer and network-fee payer.

## Slippage

`@powerchain/swap-core/slippages` owns the 0.01%–5% bounds and standard presets. `useSlippageTolerance()` persists only the user's UI tolerance, never a wallet authorization.
