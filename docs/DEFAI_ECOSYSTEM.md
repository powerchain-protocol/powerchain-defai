# PowerChain DeFAI ecosystem

The canonical ecosystem registry lives in `packages/protocol/src/ecosystem.ts`. It gives navigation, documentation and SDK layers one shared description of product modules and their authority boundaries.

PowerChain DeFAI includes AI Assistant, Swap, Bridge, Staking, Portfolio, Liquidity, Assets and Fees. The registry deliberately records whether an operation requires the wallet and which protocol owns settlement. Every module sets `aiMayExecute: false`.

The original `powerchain-bridge` repository name is retained only as a compatibility/history reference in existing file paths and deployment tooling. User-facing product copy should use **PowerChain DeFAI**.
