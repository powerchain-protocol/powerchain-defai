import type { AiProviderId } from "./providers";

export interface ChatModelSettings {
  provider: AiProviderId | "auto";
  model: string;
  temperature: number;
}

export const DEFAULT_CHAT_MODEL_SETTINGS: Readonly<ChatModelSettings> = Object.freeze({
  provider: "auto",
  model: "",
  temperature: 0.2,
});

export function normalizeChatModelSettings(value: Partial<ChatModelSettings>): ChatModelSettings {
  const provider = value.provider ?? "auto";
  const model = value.model?.trim().slice(0, 120) ?? "";
  const temperature = Number.isFinite(value.temperature) ? Math.min(1, Math.max(0, Number(value.temperature))) : 0.2;
  return { provider, model, temperature };
}
