# @powerchain/swap-core

Provider-neutral swap contracts for PowerChain DeFAI.

This workspace owns canonical swap amount/slippage validation, base-unit fee math, quote freshness, minimum-output protection, payer/asset normalization, and execution-state transitions. Jupiter and Cetus remain provider adapters; wallet signing remains outside this package.

`@powerchain/swap-core` is not a settlement authority and never stores wallet private keys.
