# PowerChain DeFAI ecosystem

The canonical ecosystem registry lives in `packages/protocol/src/ecosystem.ts`. It gives navigation, documentation and SDK layers one shared description of product modules and their authority boundaries.

PowerChain DeFAI includes AI Assistant, Swap, Bridge, Staking, Portfolio, Liquidity, Assets and Fees. The registry deliberately records whether an operation requires the wallet and which protocol owns settlement. Every module sets `aiMayExecute: false`.

The canonical repository name is `powerchain-defai`. Bridge remains a product/domain module under `apps/bridge`; repository-level paths, database application identity, Dev Container mounts, and development documentation use the DeFAI name.
