import type { DefaiPrompt } from "./types/prompts";

export const DEFAI_PROMPTS: readonly DefaiPrompt[] = [
  { id: "portfolio-risk", title: "Review portfolio risk", prompt: "Review my connected-wallet portfolio and explain concentration, chain, liquidity, and smart-contract risks without executing anything.", category: "portfolio", readOnly: true },
  { id: "best-swap-route", title: "Compare swap routes", prompt: "Compare available Solana and Sui swap routes for my selected assets, including fees, slippage, liquidity venues, and wallet costs.", category: "swap", readOnly: true },
  { id: "bridge-plan", title: "Plan a bridge", prompt: "Explain the safest PWRC/wPWRC bridge path, expected fee categories, finality checks, and what I must sign in my wallet.", category: "bridge", readOnly: true },
  { id: "liquidity-review", title: "Review liquidity", prompt: "Review relevant Cetus, Raydium, Meteora, and Orca pools and explain liquidity, fee, and impermanent-loss tradeoffs.", category: "liquidity", readOnly: true },
  { id: "staking-readiness", title: "Check staking readiness", prompt: "Check whether PowerChain staking is configured and explain staking custody, lockup, reward, and withdrawal conditions before I sign anything.", category: "staking", readOnly: true },
  { id: "defi-risk", title: "Explain DeFi risks", prompt: "Summarize the main risks in the transaction I am considering: price movement, slippage, bridge finality, pool liquidity, token authority, and wallet signature scope.", category: "risk", readOnly: true }
] as const;

export function promptById(id: string): DefaiPrompt | undefined {
  return DEFAI_PROMPTS.find((prompt) => prompt.id === id);
}
