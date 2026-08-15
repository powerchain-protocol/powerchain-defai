export type Chain = "solana" | "sui";

export const PLACEHOLDER_ADDRESS = "REPLACE_WITH_DEPLOYED_ADDRESS" as const;

export const NATIVE_ASSETS = {
  SOL: { chain: "solana" as const, symbol: "SOL", decimals: 9, assetId: "native:sol" },
  SUI: { chain: "sui" as const, symbol: "SUI", decimals: 9, assetId: "0x2::sui::SUI" },
} as const;

export type ProtocolAddresses = {
  pwrcSolanaMint: string;
  wpwrcSuiCoinType: string;
  solanaBridgeProgramId: string;
  suiBridgePackageId: string;
  wormholeSolanaManager: string;
  wormholeSolanaTransceiver: string;
  wormholeSuiManager: string;
  wormholeSuiTransceiver: string;
};

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function serverProtocolAddresses(): ProtocolAddresses {
  return {
    pwrcSolanaMint: env("POWERCHAIN_PWRC_SOLANA_MINT"),
    wpwrcSuiCoinType: env("WPWRC_SUI_COIN_TYPE"),
    solanaBridgeProgramId: env("POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID"),
    suiBridgePackageId: env("POWERCHAIN_SUI_BRIDGE_PACKAGE_ID"),
    wormholeSolanaManager: env("POWERCHAIN_NTT_SOLANA_MANAGER"),
    wormholeSolanaTransceiver: env("POWERCHAIN_NTT_SOLANA_TRANSCEIVER"),
    wormholeSuiManager: env("POWERCHAIN_NTT_SUI_MANAGER"),
    wormholeSuiTransceiver: env("POWERCHAIN_NTT_SUI_TRANSCEIVER"),
  };
}
