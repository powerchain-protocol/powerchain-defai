import { getPrice, type PriceAsset, type PriceSource } from "./prices";
import type { RateCurrency } from "./currencies";

export type RateAsset = RateCurrency;
export type RateQuote = {
  base: RateAsset;
  quote: RateAsset;
  rate: string;
  sources: string[];
  checkedAt: string;
  authoritativeForBridgeAccounting: false;
};

const SCALE = 10n ** 18n;
function toScaled(value: string): bigint { if (!/^\d+(?:\.\d+)?$/.test(value)) throw new Error("RATE_DECIMAL_INVALID"); const [whole = "0", fraction = ""] = value.split("."); return BigInt(whole) * SCALE + BigInt((fraction + "0".repeat(18)).slice(0, 18)); }
function fromScaled(value: bigint): string { const whole = value / SCALE; const fraction = (value % SCALE).toString().padStart(18, "0").replace(/0+$/, ""); return `${whole}${fraction ? `.${fraction}` : ""}`; }

export async function getRate(base: RateAsset, quote: RateAsset): Promise<RateQuote> {
  if (base === quote) return { base, quote, rate: "1", sources: ["identity"], checkedAt: new Date().toISOString(), authoritativeForBridgeAccounting: false };
  const basePoint = base === "USD" ? null : await getPrice(base); const quotePoint = quote === "USD" ? null : await getPrice(quote);
  const baseUsd = basePoint ? toScaled(basePoint.price) : SCALE; const quoteUsd = quotePoint ? toScaled(quotePoint.price) : SCALE; if (quoteUsd <= 0n) throw new Error("RATE_QUOTE_PRICE_INVALID");
  const rate = (baseUsd * SCALE) / quoteUsd;
  return { base, quote, rate: fromScaled(rate), sources: [basePoint?.source, quotePoint?.source].filter((value): value is PriceSource => value !== undefined), checkedAt: new Date().toISOString(), authoritativeForBridgeAccounting: false };
}
