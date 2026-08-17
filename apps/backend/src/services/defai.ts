import { featureFlags } from "../config/runtime-features";
import { googleGenAiReply, openAiCompatibleReply } from "./ai/provider-clients";

export interface DefaiAssistantInput {
  message: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface DefaiAssistantOutput {
  content: string;
  mode: "local-advisory" | "provider";
  advisoryOnly: true;
  requiresWalletSignatureForActions: true;
}

type ProviderConfig = {
  id: "powerchain" | "openai" | "deepseek" | "anthropic" | "google" | "openrouter";
  url?: string;
  key?: string;
  model: string;
  kind: "powerchain" | "openai" | "deepseek" | "anthropic" | "google" | "openai-compatible";
};

const SYSTEM_POLICY = [
  "You are the PowerChain DeFAI assistant.",
  "You may explain portfolio, swap, bridge, liquidity, staking, token, fee and risk information.",
  "Never claim to have signed, submitted, finalized or settled a transaction.",
  "Never request or expose private keys, seed phrases or provider secrets.",
  "Any executable action must be rebuilt by the typed application flow and explicitly signed by the connected wallet.",
  "Wormhole NTT is the sole PWRC/wPWRC cross-chain principal movement protocol.",
].join(" ");

function localReply(message: string): string {
  const text = message.toLowerCase();
  if (text.includes("bridge")) return "For PWRC ↔ wPWRC, use the validated Bridge flow. Wormhole NTT remains the sole cross-chain principal mover; review principal, fee categories, destination, finality, and reconciliation before completion.";
  if (text.includes("stake")) return "Staking is deployment-gated. Verify the configured program/package, vault or pool, custody model, reward source, lock/withdrawal conditions, and exact wallet signature before proceeding.";
  if (text.includes("swap")) return "For swaps, compare minimum received, slippage, source balance, route venues, protocol and PowerChain fees, and user-paid gas. A fresh quote must be rebuilt before wallet signing.";
  if (text.includes("pool") || text.includes("liquidity")) return "Pool data can help compare depth, fees and volatility, but it is observational. Review impermanent-loss exposure and route liquidity before adding or routing liquidity.";
  return "I can help plan and explain PowerChain DeFi actions. My output is advisory only; execution requires the normal validated application flow and an explicit connected-wallet signature.";
}

function providerConfig(): ProviderConfig | null {
  const requested = process.env.POWERCHAIN_AI_PROVIDER?.trim().toLowerCase() || "auto";
  const custom = process.env.POWERCHAIN_AI_API_URL?.trim();
  const modelOverride = process.env.POWERCHAIN_AI_MODEL?.trim();

  const powerchain = (): ProviderConfig | null => custom ? {
    id: "powerchain",
    url: custom,
    ...(process.env.POWERCHAIN_AI_API_KEY?.trim() ? { key: process.env.POWERCHAIN_AI_API_KEY.trim() } : {}),
    model: modelOverride || "powerchain-default",
    kind: "powerchain",
  } : null;
  const openai = (): ProviderConfig | null => process.env.OPENAI_API_KEY?.trim() ? {
    id: "openai", model: modelOverride || process.env.OPENAI_MODEL?.trim() || "gpt-5-mini", kind: "openai",
  } : null;
  const deepseek = (): ProviderConfig | null => process.env.DEEPSEEK_API_KEY?.trim() ? {
    id: "deepseek", model: modelOverride || process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat", kind: "deepseek",
  } : null;
  const google = (): ProviderConfig | null => (process.env.GOOGLE_GENAI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()) ? {
    id: "google", model: modelOverride || process.env.GOOGLE_GENAI_MODEL?.trim() || "gemini-2.5-flash", kind: "google",
  } : null;
  const openrouter = (): ProviderConfig | null => process.env.OPENROUTER_API_KEY?.trim() ? {
    id: "openrouter", url: process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY.trim(), model: modelOverride || "openai/gpt-5-mini", kind: "openai-compatible",
  } : null;
  const anthropic = (): ProviderConfig | null => process.env.ANTHROPIC_API_KEY?.trim() ? {
    id: "anthropic", url: "https://api.anthropic.com/v1/messages", key: process.env.ANTHROPIC_API_KEY.trim(), model: modelOverride || "claude-sonnet-4-20250514", kind: "anthropic",
  } : null;

  const byId: Record<string, () => ProviderConfig | null> = { powerchain, openai, deepseek, google, anthropic, openrouter };
  if (requested !== "auto") return byId[requested]?.() ?? null;
  return powerchain() ?? openai() ?? deepseek() ?? google() ?? anthropic() ?? openrouter();
}

function contextualMessage(input: DefaiAssistantInput): string {
  const context = input.context && Object.keys(input.context).length ? `\n\nApplication context: ${JSON.stringify(input.context)}` : "";
  return `${input.message}${context}`;
}

async function fetchProvider(config: ProviderConfig, input: DefaiAssistantInput, signal: AbortSignal): Promise<string> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  let body: unknown;
  if (config.kind === "powerchain") {
    if (config.key) headers.Authorization = `Bearer ${config.key}`;
    body = { model: config.model, system: SYSTEM_POLICY, message: input.message, context: input.context ?? {} };
  } else if (config.kind === "anthropic") {
    headers["x-api-key"] = config.key!;
    headers["anthropic-version"] = "2023-06-01";
    body = { model: config.model, max_tokens: 800, system: SYSTEM_POLICY, messages: [{ role: "user", content: contextualMessage(input) }] };
  } else {
    headers.Authorization = `Bearer ${config.key}`;
    body = { model: config.model, messages: [{ role: "developer", content: SYSTEM_POLICY }, { role: "user", content: contextualMessage(input) }], temperature: 0.2 };
  }
  const response = await fetch(config.url!, { method: "POST", headers, body: JSON.stringify(body), signal, cache: "no-store", redirect: "error" });
  if (!response.ok) throw new Error(`DEFAI_PROVIDER_${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  if (config.kind === "powerchain") return typeof payload.content === "string" ? payload.content.trim() : "";
  if (config.kind === "anthropic") {
    const parts = Array.isArray(payload.content) ? payload.content : [];
    const text = parts.find((part) => part && typeof part === "object" && (part as Record<string, unknown>).type === "text") as Record<string, unknown> | undefined;
    return typeof text?.text === "string" ? text.text.trim() : "";
  }
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  const first = choices[0] as Record<string, unknown> | undefined;
  const message = first?.message as Record<string, unknown> | undefined;
  return typeof message?.content === "string" ? message.content.trim() : "";
}

async function providerReply(config: ProviderConfig, input: DefaiAssistantInput, signal: AbortSignal): Promise<string> {
  const message = contextualMessage(input);
  if (config.kind === "openai") return openAiCompatibleReply("openai", { system: SYSTEM_POLICY, message, model: config.model, signal });
  if (config.kind === "deepseek") return openAiCompatibleReply("deepseek", { system: SYSTEM_POLICY, message, model: config.model, signal });
  if (config.kind === "google") return googleGenAiReply({ system: SYSTEM_POLICY, message, model: config.model, signal });
  return fetchProvider(config, input, signal);
}

export async function defaiAssistantReply(input: DefaiAssistantInput): Promise<DefaiAssistantOutput> {
  if (!featureFlags().ai) return { content: "PowerChain DeFAI assistant is disabled by runtime policy.", mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true };
  const config = providerConfig();
  if (!config) return { content: localReply(input.message), mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const content = await providerReply(config, input, controller.signal);
    if (!content) throw new Error("DEFAI_PROVIDER_EMPTY");
    return { content, mode: "provider", advisoryOnly: true, requiresWalletSignatureForActions: true };
  } catch {
    return { content: localReply(input.message), mode: "local-advisory", advisoryOnly: true, requiresWalletSignatureForActions: true };
  } finally {
    clearTimeout(timeout);
  }
}
