import { fetchIntegrationJson } from "../integrations/http";
import { cached } from "../utils/cache";
import { pythFeedEnvironment } from "./currencies";
import { providerUrls } from "../config/provider-urls";
import { cachePolicy } from "../config/cache";

export type PriceAsset = "SOL" | "SUI" | "PWRC" | "USDC" | "EURC";
export type PriceQuote = "USD";
export type PriceSource = "pyth" | "birdeye";
export type PricePoint = {
  asset: PriceAsset;
  quote: PriceQuote;
  price: string;
  confidence?: string;
  source: PriceSource;
  publishTime: string;
  ageMs: number;
  stale: boolean;
  authoritativeForBridgeAccounting: false;
};

type PythResponse = { parsed?: Array<{ id?: string; price?: { price?: string; conf?: string; expo?: number; publish_time?: number } }> };
type BirdeyeResponse = { success?: boolean; data?: { value?: unknown; updateUnixTime?: number } | null };

const DEFAULT_USDC_PYTH_FEED_ID = "eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a";

function maxAgeMs() { const raw = Number(process.env.POWERCHAIN_PRICE_MAX_AGE_MS ?? 60_000); return Number.isFinite(raw) ? Math.max(5_000, Math.min(raw, 300_000)) : 60_000; }
function normalizeFeedId(value: string) { const id = value.trim().replace(/^0x/, "").toLowerCase(); if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("PYTH_FEED_ID_INVALID"); return id; }
function decimalString(value: unknown) { if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) return value.trim(); if (typeof value === "number" && Number.isFinite(value)) return String(value); return null; }
function scaledIntegerToDecimal(value: string, exponent: number) { const negative = value.startsWith("-"); const digits = negative ? value.slice(1) : value; if (!/^\d+$/.test(digits)) throw new Error("PRICE_INTEGER_INVALID"); if (exponent >= 0) return `${negative ? "-" : ""}${digits}${"0".repeat(exponent)}`; const places = -exponent; const padded = digits.padStart(places + 1, "0"); const split = padded.length - places; const fraction = padded.slice(split).replace(/0+$/, ""); return `${negative ? "-" : ""}${padded.slice(0, split)}${fraction ? `.${fraction}` : ""}`; }

async function fetchPyth(asset: PriceAsset): Promise<PricePoint> {
  const feedEnv = pythFeedEnvironment(asset);
  const feedRaw = process.env[feedEnv]?.trim() || (asset === "USDC" ? DEFAULT_USDC_PYTH_FEED_ID : ""); if (!feedRaw) throw new Error(`${feedEnv}_REQUIRED`);
  const feed = normalizeFeedId(feedRaw); const base = providerUrls().pythHermes;
  const url = new URL(`${base}/v2/updates/price/latest`); url.searchParams.append("ids[]", `0x${feed}`);
  const apiKey = process.env.PYTH_API_KEY?.trim() || process.env.POWERCHAIN_PYTH_API_KEY?.trim();
  const response = await fetchIntegrationJson<PythResponse>(url.toString(), apiKey ? { headers: { authorization: `Bearer ${apiKey}` } } : {}, 6_000);
  const parsed = response.parsed?.find((entry) => entry.id?.replace(/^0x/, "").toLowerCase() === feed) ?? response.parsed?.[0]; const price = parsed?.price;
  if (!price || !/^-?\d+$/.test(price.price ?? "") || !Number.isInteger(price.expo) || !Number.isInteger(price.publish_time)) throw new Error("PYTH_PRICE_RESPONSE_INVALID");
  const publishMs = price.publish_time! * 1000; const ageMs = Math.max(0, Date.now() - publishMs); if (ageMs > maxAgeMs()) throw new Error(`PYTH_${asset}_PRICE_STALE`);
  const confidence = /^\d+$/.test(price.conf ?? "") ? scaledIntegerToDecimal(price.conf!, price.expo!) : null;
  return { asset, quote: "USD", price: scaledIntegerToDecimal(price.price!, price.expo!), ...(confidence === null ? {} : { confidence }), source: "pyth", publishTime: new Date(publishMs).toISOString(), ageMs, stale: false, authoritativeForBridgeAccounting: false };
}

async function fetchBirdeyePwrc(): Promise<PricePoint> {
  const apiKey = process.env.BIRDEYE_API_KEY?.trim() || process.env.POWERCHAIN_BIRDEYE_API_KEY?.trim(); const mint = process.env.POWERCHAIN_PWRC_SOLANA_MINT?.trim() || process.env.PWRC_SOLANA_MINT?.trim() || process.env.SOLANA_PWRC_MINT?.trim();
  if (!apiKey || !mint) throw new Error("BIRDEYE_PWRC_FALLBACK_NOT_CONFIGURED");
  const base = providerUrls().birdeye; const url = new URL(`${base}/defi/price`); url.searchParams.set("address", mint); url.searchParams.set("include_liquidity", "true"); url.searchParams.set("ui_amount_mode", "raw");
  const response = await fetchIntegrationJson<BirdeyeResponse>(url.toString(), { headers: { "X-API-KEY": apiKey, "x-chain": "solana" } }, 6_000); const value = decimalString(response.data?.value); if (!response.success || !value) throw new Error("BIRDEYE_PRICE_RESPONSE_INVALID");
  const publishMs = Number.isInteger(response.data?.updateUnixTime) ? response.data!.updateUnixTime! * 1000 : Date.now(); const ageMs = Math.max(0, Date.now() - publishMs); if (ageMs > maxAgeMs()) throw new Error("BIRDEYE_PWRC_PRICE_STALE");
  return { asset: "PWRC", quote: "USD", price: value, source: "birdeye", publishTime: new Date(publishMs).toISOString(), ageMs, stale: false, authoritativeForBridgeAccounting: false };
}

export async function getPrice(asset: PriceAsset): Promise<PricePoint> { return cached(`price:${asset}`, cachePolicy().pricesMs, async () => { try { return await fetchPyth(asset); } catch (primary) { if (asset !== "PWRC") throw primary; return fetchBirdeyePwrc(); } }); }
export async function getPrices(assets: readonly PriceAsset[]) { const unique = [...new Set(assets)].slice(0, 5); const settled = await Promise.allSettled(unique.map((asset) => getPrice(asset))); return unique.map((asset, index) => { const result = settled[index]; return result.status === "fulfilled" ? { asset, ok: true as const, data: result.value } : { asset, ok: false as const, error: result.reason instanceof Error ? result.reason.message : "PRICE_UNAVAILABLE" }; }); }
