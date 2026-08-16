export type DefaiPromptCategory = "portfolio" | "swap" | "bridge" | "liquidity" | "staking" | "risk";

export interface DefaiPrompt {
  id: string;
  title: string;
  prompt: string;
  category: DefaiPromptCategory;
  readOnly: true;
}

export interface SavedDefaiPrompt extends DefaiPrompt {
  savedAt: string;
}
