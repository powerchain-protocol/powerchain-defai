import type { UIMessage } from "ai";
import type { AiProviderId } from "./providers";

export interface PowerChainAiMessageMetadata {
  provider?: AiProviderId;
  model?: string;
  advisoryOnly: true;
  requiresWalletSignatureForActions: true;
}

export type PowerChainUiMessage = UIMessage<PowerChainAiMessageMetadata>;
