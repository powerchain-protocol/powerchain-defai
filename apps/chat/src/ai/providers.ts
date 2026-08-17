export type AiProviderId = "powerchain" | "openai" | "deepseek" | "google" | "anthropic" | "openrouter";

export interface AiProviderDescriptor {
  id: AiProviderId;
  label: string;
  transport: "powerchain" | "openai-compatible" | "google-genai" | "anthropic";
  serverCredentialsOnly: true;
}

export const AI_PROVIDERS: readonly AiProviderDescriptor[] = Object.freeze([
  { id: "powerchain", label: "PowerChain", transport: "powerchain", serverCredentialsOnly: true },
  { id: "openai", label: "OpenAI", transport: "openai-compatible", serverCredentialsOnly: true },
  { id: "deepseek", label: "DeepSeek", transport: "openai-compatible", serverCredentialsOnly: true },
  { id: "google", label: "Google Gemini", transport: "google-genai", serverCredentialsOnly: true },
  { id: "anthropic", label: "Anthropic", transport: "anthropic", serverCredentialsOnly: true },
  { id: "openrouter", label: "OpenRouter", transport: "openai-compatible", serverCredentialsOnly: true },
]);

export function aiProviderDescriptor(id: AiProviderId): AiProviderDescriptor | undefined {
  return AI_PROVIDERS.find((provider) => provider.id === id);
}
