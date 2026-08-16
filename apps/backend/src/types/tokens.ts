import type { BlockchainChain } from "@powerchain/blockchain";
export type TokenChain = BlockchainChain;
export type TokenIconSource = "powerchain-local" | "official" | "cryptoicons-cc" | "symbol";
export type TokenIcon = { source: TokenIconSource; uri?: string };
export type TokenMetadata = { id: string; chain: TokenChain; address: string; symbol: string; name: string; decimals: number; icon: TokenIcon; informationCommitment?: string };
