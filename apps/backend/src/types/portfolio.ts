import type { BlockchainChain } from "@powerchain/blockchain";
export type PortfolioBalance = { tokenId:string; chain:BlockchainChain; symbol:string; address:string; balanceBaseUnits:string; decimals:number };
export type PortfolioSnapshot = { wallets:{solana:string|null;sui:string|null}; balances:PortfolioBalance[]; checkedAt:string; status:"ready"|"degraded"|"unavailable"; authoritativeForBridgeAccounting:false };
