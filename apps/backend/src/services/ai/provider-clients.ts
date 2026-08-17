import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export type OpenAiCompatibleProvider = "openai" | "deepseek";

export interface ProviderReplyInput {
  system: string;
  message: string;
  model: string;
  signal?: AbortSignal;
}

function trimRequired(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`${name}_REQUIRED`);
  return normalized;
}

export function createOpenAiCompatibleClient(provider: OpenAiCompatibleProvider): OpenAI {
  if (provider === "deepseek") {
    return new OpenAI({
      apiKey: trimRequired(process.env.DEEPSEEK_API_KEY, "DEEPSEEK_API_KEY"),
      baseURL: process.env.DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
      timeout: 15_000,
      maxRetries: 1,
    });
  }
  return new OpenAI({
    apiKey: trimRequired(process.env.OPENAI_API_KEY, "OPENAI_API_KEY"),
    baseURL: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
    timeout: 15_000,
    maxRetries: 1,
  });
}

export async function openAiCompatibleReply(provider: OpenAiCompatibleProvider, input: ProviderReplyInput): Promise<string> {
  const client = createOpenAiCompatibleClient(provider);
  const response = await client.chat.completions.create({
    model: input.model,
    messages: [
      { role: "developer", content: input.system },
      { role: "user", content: input.message },
    ],
    temperature: 0.2,
  }, input.signal ? { signal: input.signal } : undefined);
  return response.choices[0]?.message?.content?.trim() || "";
}

export function createGoogleGenAiClient(): GoogleGenAI {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  return new GoogleGenAI({ apiKey: trimRequired(apiKey, "GOOGLE_GENAI_API_KEY") });
}

export async function googleGenAiReply(input: ProviderReplyInput): Promise<string> {
  const client = createGoogleGenAiClient();
  const response = await client.models.generateContent({
    model: input.model,
    contents: input.message,
    config: { systemInstruction: input.system },
  });
  return response.text?.trim() || "";
}
