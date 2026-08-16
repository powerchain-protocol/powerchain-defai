import { normalizeSuiAddress } from "@powerchain/blockchain";

export const POWERCHAIN_SUI_BRIDGE_MODULE = "powerchain_bridge" as const;

export const POWERCHAIN_SUI_BRIDGE_FUNCTIONS = [
  "create_information_commitment",
  "set_authority",
  "set_paused",
  "record_intent",
] as const;

export type PowerChainSuiBridgeFunction = (typeof POWERCHAIN_SUI_BRIDGE_FUNCTIONS)[number];

export function suiBridgeTarget(packageId: string, fn: PowerChainSuiBridgeFunction): string {
  const normalizedPackageId = normalizeSuiAddress(packageId);
  return `${normalizedPackageId}::${POWERCHAIN_SUI_BRIDGE_MODULE}::${fn}`;
}

export function suiBridgeTargets(packageId: string) {
  const normalizedPackageId = normalizeSuiAddress(packageId);
  return {
    packageId: normalizedPackageId,
    module: POWERCHAIN_SUI_BRIDGE_MODULE,
    createInformationCommitment: suiBridgeTarget(normalizedPackageId, "create_information_commitment"),
    setAuthority: suiBridgeTarget(normalizedPackageId, "set_authority"),
    setPaused: suiBridgeTarget(normalizedPackageId, "set_paused"),
    recordIntent: suiBridgeTarget(normalizedPackageId, "record_intent"),
  } as const;
}
