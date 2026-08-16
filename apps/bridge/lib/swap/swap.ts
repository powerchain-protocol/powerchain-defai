export { DEFAULT_SWAP_SLIPPAGE_BPS, MIN_SWAP_SLIPPAGE_BPS, MAX_SWAP_SLIPPAGE_BPS, SWAP_QUOTE_TTL_MS, assertSlippageBps, minimumOutputBaseUnits } from "@powerchain/swap-core";
import { POWERCHAIN_SWAP_FEE_BPS } from "@powerchain/swap-core";

export const POWERCHAIN_PWRC_FEE_BPS = POWERCHAIN_SWAP_FEE_BPS;

export type SwapAssetId = "sui" | "wpwrc" | "usdc";

export type SwapAsset = {
  id: SwapAssetId;
  symbol: "SUI" | "wPWRC" | "USDC";
  name: string;
  decimals: number;
  coinType: string;
  icon?: string;
};

export function configuredSwapAssets(): readonly SwapAsset[] {
  const wpwrc = process.env.NEXT_PUBLIC_POWERCHAIN_WPWRC_SUI_COIN_TYPE?.trim() ?? "";
  const usdc = process.env.NEXT_PUBLIC_POWERCHAIN_SUI_USDC_COIN_TYPE?.trim() ?? "";
  const assets: SwapAsset[] = [
    { id: "sui", symbol: "SUI", name: "Sui", decimals: 9, coinType: "0x2::sui::SUI" },
  ];
  if (wpwrc) assets.push({ id: "wpwrc", symbol: "wPWRC", name: "Wrapped PowerChain", decimals: 9, coinType: wpwrc, icon: "/tokens/wpwrc.png" });
  if (usdc) assets.push({ id: "usdc", symbol: "USDC", name: "USD Coin", decimals: 6, coinType: usdc });
  return Object.freeze(assets);
}

export type SwapQuote = {
  quoteId: string;
  payer: string;
  fromCoinType: string;
  toCoinType: string;
  amountInBaseUnits: string;
  amountOutBaseUnits: string;
  minimumOutBaseUnits: string;
  slippageBps: number;
  providers: readonly string[];
  priceDeviationRatio: number | null;
  protocolFeeBps: number;
  protocolFeeMode: "cetus-overlay";
  protocolFeeReceiver: string;
  userPaysNetworkFees: true;
  sponsored: false;
  expiresAt: string;
  source: "cetus-aggregator";
};
