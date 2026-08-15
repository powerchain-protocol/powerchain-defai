import "server-only";
import { fetchJson } from "../../lib/data/http-client";
import { decimalString, scaledIntegerToDecimal } from "../../lib/data/decimal";

export type MarketAsset = "SOL" | "SUI" | "PWRC";
export type MarketPrice = {
  asset: MarketAsset;
  quote: "USD";
  price: string;
  confidence?: string;
  source: "pyth" | "birdeye";
  publishTime: string;
  ageMs: number;
  stale: boolean;
  authoritativeForBridgeAccounting: false;
};

type PythResponse = { parsed?: Array<{ id?: string; price?: { price?: string; conf?: string; expo?: number; publish_time?: number } }> };
type BirdeyeResponse = { success?: boolean; data?: { value?: unknown; updateUnixTime?: number; updateHumanTime?: string } | null };

const FEED_ENV: Record<MarketAsset, string> = {
  SOL: "POWERCHAIN_PYTH_SOL_USD_FEED_ID",
  SUI: "POWERCHAIN_PYTH_SUI_USD_FEED_ID",
  PWRC: "POWERCHAIN_PYTH_PWRC_USD_FEED_ID",
};

function maxAgeMs() {
  const raw = Number(process.env.POWERCHAIN_PRICE_MAX_AGE_MS ?? 60_000);
  return Number.isFinite(raw) ? Math.max(5_000, Math.min(raw, 300_000)) : 60_000;
}

function normalizeFeedId(value: string) {
  const id = value.trim().replace(/^0x/, "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("invalid Pyth feed id");
  return id;
}

async function pyth(asset: MarketAsset): Promise<MarketPrice> {
  const feedRaw = process.env[FEED_ENV[asset]]?.trim();
  if (!feedRaw) throw new Error(`${FEED_ENV[asset]} is not configured`);
  const feed = normalizeFeedId(feedRaw);
  const base = (process.env.POWERCHAIN_PYTH_HERMES_URL?.trim() || "https://pyth.dourolabs.app/hermes").replace(/\/$/, "");
  const url = new URL(`${base}/v2/updates/price/latest`);
  url.searchParams.append("ids[]", `0x${feed}`);
  const apiKey = process.env.PYTH_API_KEY?.trim() || process.env.POWERCHAIN_PYTH_API_KEY?.trim();
  const response = await fetchJson<PythResponse>(url, {
    timeoutMs: 6_000,
    maxAttempts: 2,
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
  });
  const parsed = response.parsed?.find((entry) => entry.id?.replace(/^0x/, "").toLowerCase() === feed) ?? response.parsed?.[0];
  const price = parsed?.price;
  if (!price || !/^-?\d+$/.test(price.price ?? "") || !Number.isInteger(price.expo) || !Number.isInteger(price.publish_time)) throw new Error("invalid Pyth price response");
  const publishMs = price.publish_time! * 1000;
  const ageMs = Math.max(0, Date.now() - publishMs);
  if (ageMs > maxAgeMs()) throw new Error(`Pyth ${asset}/USD price is stale`);
  return {
    asset,
    quote: "USD",
    price: scaledIntegerToDecimal(price.price!, price.expo!),
    confidence: /^\d+$/.test(price.conf ?? "") ? scaledIntegerToDecimal(price.conf!, price.expo!) : undefined,
    source: "pyth",
    publishTime: new Date(publishMs).toISOString(),
    ageMs,
    stale: false,
    authoritativeForBridgeAccounting: false,
  };
}

async function birdeyePwrc(): Promise<MarketPrice> {
  const apiKey = process.env.BIRDEYE_API_KEY?.trim();
  const mint = process.env.POWERCHAIN_PWRC_SOLANA_MINT?.trim() || process.env.PWRC_SOLANA_MINT?.trim() || process.env.SOLANA_PWRC_MINT?.trim();
  if (!apiKey || !mint) throw new Error("Birdeye PWRC fallback is not configured");
  const url = new URL("https://public-api.birdeye.so/defi/price");
  url.searchParams.set("address", mint);
  url.searchParams.set("include_liquidity", "true");
  url.searchParams.set("ui_amount_mode", "raw");
  const response = await fetchJson<BirdeyeResponse>(url, {
    timeoutMs: 6_000,
    maxAttempts: 2,
    headers: { "X-API-KEY": apiKey, "x-chain": "solana" },
  });
  const value = decimalString(response.data?.value);
  if (!response.success || !value) throw new Error("invalid Birdeye price response");
  const publishMs = Number.isInteger(response.data?.updateUnixTime) ? response.data!.updateUnixTime! * 1000 : Date.now();
  const ageMs = Math.max(0, Date.now() - publishMs);
  if (ageMs > maxAgeMs()) throw new Error("Birdeye PWRC/USD price is stale");
  return { asset: "PWRC", quote: "USD", price: value, source: "birdeye", publishTime: new Date(publishMs).toISOString(), ageMs, stale: false, authoritativeForBridgeAccounting: false };
}

export async function getMarketPrice(asset: MarketAsset): Promise<MarketPrice> {
  try {
    return await pyth(asset);
  } catch (primary) {
    if (asset !== "PWRC") throw primary;
    return birdeyePwrc();
  }
}

export async function getMarketPrices(assets: MarketAsset[]) {
  const unique = [...new Set(assets)].slice(0, 3);
  const settled = await Promise.allSettled(unique.map((asset) => getMarketPrice(asset)));
  return unique.map((asset, index) => {
    const value = settled[index];
    return value.status === "fulfilled" ? { asset, ok: true as const, data: value.value } : { asset, ok: false as const, error: value.reason instanceof Error ? value.reason.message : "price unavailable" };
  });
}
