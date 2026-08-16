import type { DefaiMessage } from "./messages";

export type DefaiCapability = "portfolio" | "swap" | "bridge" | "liquidity" | "staking" | "market-data";

export interface DefaiChatContext {
  wallet?: { solana?: string; sui?: string };
  capabilities: readonly DefaiCapability[];
  network: "mainnet" | "testnet" | "mixed";
}

export interface DefaiChatRequest {
  messages: readonly DefaiMessage[];
  context: DefaiChatContext;
}

export interface DefaiChatResponse {
  message: DefaiMessage;
  advisoryOnly: true;
  requiresWalletSignatureForActions: true;
  suggestedRoute?: string;
}
