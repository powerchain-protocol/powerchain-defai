export type CurrencyKind = "fiat" | "crypto" | "stablecoin";
export type CurrencyChain = "SOLANA" | "SUI" | "OFFCHAIN";
export type CurrencySymbol = "USD" | "EUR" | "GBP" | "SOL" | "SUI" | "PWRC" | "USDC" | "EURC";

export type CurrencyDefinition = {
  symbol: CurrencySymbol;
  name: string;
  kind: CurrencyKind;
  decimals: number;
  quoteCurrency: "USD";
  pythSymbol?: string;
  pythFeedEnv?: string;
  chains: readonly CurrencyChain[];
};

export const CURRENCIES: Readonly<Record<CurrencySymbol, CurrencyDefinition>> = Object.freeze({
  USD: { symbol: "USD", name: "US Dollar", kind: "fiat", decimals: 2, quoteCurrency: "USD", chains: ["OFFCHAIN"] },
  EUR: { symbol: "EUR", name: "Euro", kind: "fiat", decimals: 2, quoteCurrency: "USD", chains: ["OFFCHAIN"] },
  GBP: { symbol: "GBP", name: "British Pound", kind: "fiat", decimals: 2, quoteCurrency: "USD", chains: ["OFFCHAIN"] },
  SOL: { symbol: "SOL", name: "Solana", kind: "crypto", decimals: 9, quoteCurrency: "USD", pythSymbol: "Crypto.SOL/USD", pythFeedEnv: "POWERCHAIN_PYTH_SOL_USD_FEED_ID", chains: ["SOLANA"] },
  SUI: { symbol: "SUI", name: "Sui", kind: "crypto", decimals: 9, quoteCurrency: "USD", pythSymbol: "Crypto.SUI/USD", pythFeedEnv: "POWERCHAIN_PYTH_SUI_USD_FEED_ID", chains: ["SUI"] },
  PWRC: { symbol: "PWRC", name: "PowerChain", kind: "crypto", decimals: 9, quoteCurrency: "USD", pythSymbol: "Crypto.PWRC/USD", pythFeedEnv: "POWERCHAIN_PYTH_PWRC_USD_FEED_ID", chains: ["SOLANA", "SUI"] },
  USDC: { symbol: "USDC", name: "USD Coin", kind: "stablecoin", decimals: 6, quoteCurrency: "USD", pythSymbol: "Crypto.USDC/USD", pythFeedEnv: "POWERCHAIN_PYTH_USDC_USD_FEED_ID", chains: ["SOLANA", "SUI"] },
  EURC: { symbol: "EURC", name: "EURC", kind: "stablecoin", decimals: 6, quoteCurrency: "USD", pythSymbol: "Crypto.EURC/USD", pythFeedEnv: "POWERCHAIN_PYTH_EURC_USD_FEED_ID", chains: ["SOLANA"] },
});

export const FIAT_CURRENCIES = Object.freeze(["USD", "EUR", "GBP"] as const);
export type FiatCurrency = typeof FIAT_CURRENCIES[number];
export const MARKET_PRICE_CURRENCIES = Object.freeze(["SOL", "SUI", "PWRC", "USDC", "EURC"] as const);
export type MarketPriceCurrency = typeof MARKET_PRICE_CURRENCIES[number];
export const RATE_CURRENCIES = Object.freeze(["USD", "SOL", "SUI", "PWRC", "USDC", "EURC"] as const);
export type RateCurrency = typeof RATE_CURRENCIES[number];

export function isCurrencySymbol(value: string): value is CurrencySymbol { return Object.prototype.hasOwnProperty.call(CURRENCIES, value); }
export function isFiatCurrency(value: string): value is FiatCurrency { return (FIAT_CURRENCIES as readonly string[]).includes(value); }
export function isMarketPriceCurrency(value: string): value is MarketPriceCurrency { return (MARKET_PRICE_CURRENCIES as readonly string[]).includes(value); }
export function currency(symbol: CurrencySymbol): CurrencyDefinition { return CURRENCIES[symbol]; }
export function pythFeedEnvironment(symbol: MarketPriceCurrency): string { const value = CURRENCIES[symbol].pythFeedEnv; if (!value) throw new Error("PYTH_FEED_ENVIRONMENT_UNAVAILABLE"); return value; }
