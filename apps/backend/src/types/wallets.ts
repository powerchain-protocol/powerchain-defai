import type { BlockchainChain } from "@powerchain/blockchain";
export type WalletIdentity = { chain:BlockchainChain; address:string; source:"connected-wallet"|"embedded-wallet" };
export type WalletSigningPolicy = { userSignatureRequired:true; networkFeePayer:"connected-wallet"; serverMaySign:false };
