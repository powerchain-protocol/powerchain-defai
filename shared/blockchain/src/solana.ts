/**
 * Canonical Solana Kit v7 surface for PowerChain.
 *
 * New read/RPC/subscription code should prefer these Kit primitives. Legacy
 * `@solana/web3.js` remains only where third-party wallet/token libraries still
 * require its transaction/PublicKey types.
 */
export {
  address,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
} from "@solana/kit";
export type { Address } from "@solana/kit";
