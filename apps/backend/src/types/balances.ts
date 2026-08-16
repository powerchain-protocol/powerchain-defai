import type { BlockchainChain } from "@powerchain/blockchain";
export type AssetBalance = { wallet:string; chain:BlockchainChain; asset:string; amountBaseUnits:string; decimals:number; observedAt:string };
