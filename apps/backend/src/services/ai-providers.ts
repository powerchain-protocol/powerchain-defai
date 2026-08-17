export type AiProviderId = "powerchain" | "openai" | "anthropic" | "google" | "deepseek" | "openrouter";

export function aiProviderStatus() {
  const googleConfigured = Boolean(process.env.GOOGLE_GENAI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim());
  return Object.freeze({
    enabled: (process.env.ENABLE_AI ?? "true").trim().toLowerCase() !== "false",
    selected: process.env.POWERCHAIN_AI_PROVIDER?.trim().toLowerCase() || "auto",
    providers: {
      powerchain: Boolean(process.env.POWERCHAIN_AI_API_URL?.trim()),
      openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      google: googleConfigured,
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY?.trim()),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
    },
    advisoryOnly: true as const,
    walletSigningAuthority: false as const,
  });
}
