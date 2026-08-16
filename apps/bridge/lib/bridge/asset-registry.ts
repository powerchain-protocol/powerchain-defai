import {
  POWERCHAIN_ASSET_REGISTRY,
  PWRC_SOLANA_ASSET,
  WPWRC_SUI_ASSET,
  type PowerChainAssetChain,
  type PowerChainAssetDescriptor,
  type PowerChainAssetKind,
} from "@powerchain/protocol";

export type BridgeAssetChain = PowerChainAssetChain;
export type BridgeAssetKind = PowerChainAssetKind;
export type BridgeAssetDescriptor = PowerChainAssetDescriptor;
export { PWRC_SOLANA_ASSET, WPWRC_SUI_ASSET };
export const POWERCHAIN_BRIDGE_ASSETS = POWERCHAIN_ASSET_REGISTRY;

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
