export type BridgeAssetChain = "SOLANA" | "SUI";
export type BridgeAssetKind = "native" | "bridged";

export type BridgeAssetDescriptor = {
  id: "pwrc-solana" | "wpwrc-sui";
  symbol: "PWRC" | "wPWRC";
  name: string;
  chain: BridgeAssetChain;
  kind: BridgeAssetKind;
  decimals: 9;
  canonicalAssetId: "powerchain-pwrc";
  representationOf?: "pwrc-solana";
};

export const PWRC_SOLANA_ASSET: BridgeAssetDescriptor = {
  id: "pwrc-solana",
  symbol: "PWRC",
  name: "PowerChain",
  chain: "SOLANA",
  kind: "native",
  decimals: 9,
  canonicalAssetId: "powerchain-pwrc",
};

export const WPWRC_SUI_ASSET: BridgeAssetDescriptor = {
  id: "wpwrc-sui",
  symbol: "wPWRC",
  name: "Wrapped PowerChain",
  chain: "SUI",
  kind: "bridged",
  decimals: 9,
  canonicalAssetId: "powerchain-pwrc",
  representationOf: "pwrc-solana",
};

export const POWERCHAIN_BRIDGE_ASSETS = [PWRC_SOLANA_ASSET, WPWRC_SUI_ASSET] as const;

export function bridgeAssetForChain(chain: BridgeAssetChain) {
  return chain === "SOLANA" ? PWRC_SOLANA_ASSET : WPWRC_SUI_ASSET;
}

export function oppositeBridgeAsset(asset: BridgeAssetDescriptor) {
  return asset.chain === "SOLANA" ? WPWRC_SUI_ASSET : PWRC_SOLANA_ASSET;
}

export function assertOneToOnePrincipal(sourceBaseUnits: bigint, destinationBaseUnits: bigint) {
  if (sourceBaseUnits <= 0n) throw new Error("BRIDGE_PRINCIPAL_MUST_BE_POSITIVE");
  if (sourceBaseUnits !== destinationBaseUnits) throw new Error("BRIDGE_PRINCIPAL_NOT_ONE_TO_ONE");
  return true;
}
