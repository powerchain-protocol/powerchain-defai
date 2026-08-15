import { NATIVE_ASSETS } from "@powerchain/protocol/addresses";

export const assets = {
  SOL: NATIVE_ASSETS.SOL,
  SUI: NATIVE_ASSETS.SUI,
  PWRC: { chain: "solana" as const, symbol: "PWRC", decimals: 9, mint: process.env.NEXT_PUBLIC_POWERCHAIN_PWRC_SOLANA_MINT?.trim() || "" },
  wPWRC: { chain: "sui" as const, symbol: "wPWRC", decimals: 9, coinType: process.env.NEXT_PUBLIC_POWERCHAIN_WPWRC_SUI_COIN_TYPE?.trim() || "" },
} as const;
