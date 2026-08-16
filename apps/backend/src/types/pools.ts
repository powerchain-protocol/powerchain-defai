import type { BlockchainChain } from "@powerchain/blockchain";
export type PoolChain = BlockchainChain;
export type PoolProvider = "cetus" | "raydium" | "meteora" | "orca" | "jupiter";
export type PoolSnapshot = { id: string; chain: PoolChain; provider: PoolProvider; tokenA: string; tokenB: string; tvlUsd: number | null; volume24hUsd: number | null; feeRatePct: number | null; fetchedAt: string };
