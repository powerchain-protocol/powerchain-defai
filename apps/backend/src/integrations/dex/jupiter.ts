import { fetchIntegrationJson } from "../http";
import { providerUrls } from "../../config/provider-urls";

const DEFAULT = "https://api.jup.ag/swap/v2";
const KEY_PATTERN = /^[\x21-\x7E]{8,512}$/;

export type JupiterRequestOverride = Readonly<{ apiUrl?: string | null; apiKey?: string | null }>;
export type JupiterRequestConfig = Readonly<{ apiUrl: string; apiKey: string; source: "server" | "user" }>;

function serverBase() { return process.env.POWERCHAIN_JUPITER_API_URL?.trim().replace(/\/+$/, "") || DEFAULT; }
function serverKey() { return process.env.JUPITER_API_KEY?.trim() || process.env.POWERCHAIN_JUPITER_API_KEY?.trim() || ""; }
function allowedUserHosts() {
  return new Set(["api.jup.ag", ...(process.env.POWERCHAIN_JUPITER_USER_API_HOSTS ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean)]);
}

function unsafeProductionHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return true;
  if (host.includes(":")) return true; // IP-literal IPv6 is not accepted for user provider targets.
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true; // Use an operator-reviewed DNS hostname instead of an IP literal.
  return false;
}

function validateUserBase(value: string): string {
  if (value.length > 2048) throw new Error("JUPITER_CUSTOM_API_URL_INVALID");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("JUPITER_CUSTOM_API_URL_INVALID"); }
  if (url.username || url.password || url.search || url.hash) throw new Error("JUPITER_CUSTOM_API_URL_UNSAFE");
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname.toLowerCase());
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && url.protocol === "http:")) throw new Error("JUPITER_CUSTOM_API_HTTPS_REQUIRED");
  if (!url.pathname.replace(/\/+$/, "").endsWith("/swap/v2")) throw new Error("JUPITER_CUSTOM_API_PATH_INVALID");
  if (process.env.NODE_ENV === "production" && unsafeProductionHost(url.hostname)) throw new Error("JUPITER_CUSTOM_API_HOST_UNSAFE");
  if (process.env.NODE_ENV === "production" && !allowedUserHosts().has(url.hostname.toLowerCase())) throw new Error("JUPITER_CUSTOM_API_HOST_NOT_ALLOWED");
  return url.toString().replace(/\/+$/, "");
}

export function resolveJupiterRequestConfig(override?: JupiterRequestOverride): JupiterRequestConfig {
  const overrideUrl = override?.apiUrl?.trim() || "";
  const overrideKey = override?.apiKey?.trim() || "";
  if (overrideUrl && !overrideKey) throw new Error("JUPITER_CUSTOM_API_KEY_REQUIRED");
  if (overrideKey && !KEY_PATTERN.test(overrideKey)) throw new Error("JUPITER_CUSTOM_API_KEY_INVALID");
  if (overrideUrl || overrideKey) return { apiUrl: overrideUrl ? validateUserBase(overrideUrl) : serverBase(), apiKey: overrideKey, source: "user" };
  const key = serverKey();
  if (!key) throw new Error("JUPITER_API_KEY_REQUIRED");
  return { apiUrl: serverBase(), apiKey: key, source: "server" };
}

function headers(config: JupiterRequestConfig) { return { "x-api-key": config.apiKey }; }

export async function fetchJupiterOrder(input: { inputMint: string; outputMint: string; amountBaseUnits: string; taker: string; slippageBps: number }, override?: JupiterRequestOverride) {
  const config = resolveJupiterRequestConfig(override);
  const url = new URL(`${config.apiUrl}/order`);
  url.searchParams.set("inputMint", input.inputMint); url.searchParams.set("outputMint", input.outputMint); url.searchParams.set("amount", input.amountBaseUnits); url.searchParams.set("taker", input.taker); url.searchParams.set("slippageBps", String(input.slippageBps));
  return fetchIntegrationJson<unknown>(url.toString(), { headers: headers(config) });
}

export function jupiterIntegrationStatus() {
  const urls = providerUrls();
  return { provider: "jupiter" as const, chain: "solana" as const, apiUrl: serverBase(), apiKeyConfigured: Boolean(serverKey()), swapV2: true, userCredentialOverrideSupported: true, customHostAllowlistConfigured: Boolean(process.env.POWERCHAIN_JUPITER_USER_API_HOSTS?.trim()), legacy: { quote: urls.jupiterLegacyQuote, swap: urls.jupiterLegacySwap, price: urls.jupiterLegacyPrice, tokenList: urls.jupiterTokenList }, legacyExecutionEnabled: false as const };
}
