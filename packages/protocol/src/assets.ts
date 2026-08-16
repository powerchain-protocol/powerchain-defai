import { POWERCHAIN_INFORMATION_COMMITMENT, POWERCHAIN_TOKEN_INFORMATION } from "./token-information";

export type PowerChainAssetChain = "SOLANA" | "SUI";
export type PowerChainAssetKind = "native" | "bridged";
export type PowerChainAssetDescriptor = {
  id: "pwrc-solana" | "wpwrc-sui";
  symbol: "PWRC" | "wPWRC";
  name: string;
  chain: PowerChainAssetChain;
  kind: PowerChainAssetKind;
  decimals: 9;
  canonicalAssetId: "powerchain-pwrc";
  informationCommitment: typeof POWERCHAIN_INFORMATION_COMMITMENT;
  representationOf?: "pwrc-solana";
};

export const PWRC_SOLANA_ASSET: PowerChainAssetDescriptor = Object.freeze({
  id: "pwrc-solana",
  symbol: "PWRC",
  name: POWERCHAIN_TOKEN_INFORMATION.name,
  chain: "SOLANA",
  kind: "native",
  decimals: POWERCHAIN_TOKEN_INFORMATION.decimals,
  canonicalAssetId: POWERCHAIN_TOKEN_INFORMATION.canonicalAssetId,
  informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT,
});

export const WPWRC_SUI_ASSET: PowerChainAssetDescriptor = Object.freeze({
  id: "wpwrc-sui",
  symbol: "wPWRC",
  name: "Wrapped PowerChain",
  chain: "SUI",
  kind: "bridged",
  decimals: POWERCHAIN_TOKEN_INFORMATION.decimals,
  canonicalAssetId: POWERCHAIN_TOKEN_INFORMATION.canonicalAssetId,
  informationCommitment: POWERCHAIN_INFORMATION_COMMITMENT,
  representationOf: "pwrc-solana",
});

export const POWERCHAIN_ASSET_REGISTRY = Object.freeze([PWRC_SOLANA_ASSET, WPWRC_SUI_ASSET] as const);
