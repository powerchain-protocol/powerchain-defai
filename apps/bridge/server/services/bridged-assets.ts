import "server-only";

import { checkPwrcAssetIntegrity } from "./asset-integrity";
import { POWERCHAIN_BRIDGE_ASSETS } from "../../lib/bridge/asset-registry";

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return null;
}

export async function getBridgedAssetRegistry() {
  const integrity = await checkPwrcAssetIntegrity().catch(() => null);
  const solanaMint = env("POWERCHAIN_PWRC_SOLANA_MINT", "PWRC_SOLANA_MINT", "SOLANA_PWRC_MINT");
  const suiCoinType = env("WPWRC_SUI_COIN_TYPE", "SUI_WPWRC_COIN_TYPE");

  return {
    version: 1,
    canonicalAssetId: "powerchain-pwrc",
    principalRule: "1:1" as const,
    authoritativeForBridgeAccounting: false as const,
    assets: POWERCHAIN_BRIDGE_ASSETS.map((asset) => ({
      ...asset,
      identifier: asset.chain === "SOLANA" ? solanaMint : suiCoinType,
      configured: asset.chain === "SOLANA" ? Boolean(solanaMint) : Boolean(suiCoinType),
      integrity: asset.chain === "SOLANA"
        ? integrity?.solana?.ok === true
        : integrity?.sui?.ok === true,
    })),
    route: {
      protocol: "Wormhole NTT",
      solanaToSui: { source: "PWRC", destination: "wPWRC" },
      suiToSolana: { source: "wPWRC", destination: "PWRC" },
    },
    checkedAt: new Date().toISOString(),
  };
}
