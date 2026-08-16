import type { BlockchainChain } from "@powerchain/clusters";
export type CrossChainDirection = "SOLANA_TO_SUI" | "SUI_TO_SOLANA";
export type CrossChainPair = { direction: CrossChainDirection; sourceChain: BlockchainChain; destinationChain: BlockchainChain };
const PAIRS: Record<CrossChainDirection, CrossChainPair> = {
  SOLANA_TO_SUI: { direction: "SOLANA_TO_SUI", sourceChain: "SOLANA", destinationChain: "SUI" },
  SUI_TO_SOLANA: { direction: "SUI_TO_SOLANA", sourceChain: "SUI", destinationChain: "SOLANA" },
};
export const CROSS_CHAIN_PAIRS: readonly CrossChainPair[] = Object.freeze([PAIRS.SUI_TO_SOLANA, PAIRS.SOLANA_TO_SUI]);
export function otherChain(chain: BlockchainChain): BlockchainChain { return chain === "SOLANA" ? "SUI" : "SOLANA"; }
export function crossChainDirection(sourceChain: BlockchainChain, destinationChain: BlockchainChain): CrossChainDirection {
  if (sourceChain === destinationChain) throw new Error("CROSS_CHAIN_DESTINATION_MUST_DIFFER");
  return sourceChain === "SOLANA" ? "SOLANA_TO_SUI" : "SUI_TO_SOLANA";
}
export function crossChainPair(direction: CrossChainDirection): CrossChainPair { return PAIRS[direction]; }
export function parseCrossChainDirection(value: unknown): CrossChainDirection {
  if (value === "SOLANA_TO_SUI" || value === "SUI_TO_SOLANA") return value;
  throw new Error("CROSS_CHAIN_DIRECTION_INVALID");
}
