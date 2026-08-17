/** @powerchain-isomorphic-browser-guard Browser globals are accessed only behind explicit runtime guards. */
import { readSessionSecrets, readStoredSettings, normalizeHttpEndpoint } from "@/lib/settings/storage";

export const POWERCHAIN_JUPITER_API_KEY_HEADER = "x-powerchain-jupiter-api-key";
export const POWERCHAIN_JUPITER_API_URL_HEADER = "x-powerchain-jupiter-api-url";

export function resolveClientApiRequest(input: string | URL, initHeaders?: HeadersInit): { url: string | URL; headers: Headers } {
  const headers = new Headers(initHeaders);
  if (typeof window === "undefined" || typeof input !== "string" || !input.startsWith("/api/v1/")) return { url: input, headers };
  const settings = readStoredSettings();
  const secrets = readSessionSecrets();
  const base = settings.connectivity.useCustomApi && settings.connectivity.apiBaseUrl.trim()
    ? normalizeHttpEndpoint(settings.connectivity.apiBaseUrl, { allowLocalDevelopment: process.env.NODE_ENV !== "production" })
    : "";
  if (base && secrets.powerChainApiKey) headers.set("x-api-key", secrets.powerChainApiKey);
  if (input.startsWith("/api/v1/swap/solana/") && settings.jupiter.useCustomCredentials) {
    if (secrets.jupiterApiKey) headers.set(POWERCHAIN_JUPITER_API_KEY_HEADER, secrets.jupiterApiKey);
    if (settings.jupiter.apiBaseUrl.trim()) headers.set(POWERCHAIN_JUPITER_API_URL_HEADER, settings.jupiter.apiBaseUrl.trim());
  }
  return { url: base ? `${base}${input}` : input, headers };
}

export function configuredApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const settings = readStoredSettings();
  if (!settings.connectivity.useCustomApi || !settings.connectivity.apiBaseUrl.trim()) return "";
  return normalizeHttpEndpoint(settings.connectivity.apiBaseUrl, { allowLocalDevelopment: process.env.NODE_ENV !== "production" });
}

export function customApiEnabled(): boolean {
  try { return Boolean(configuredApiBaseUrl()); } catch { return false; }
}
