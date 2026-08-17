export type IntegrationKind = "dex" | "storage" | "bridge" | "oracle" | "explorer";
export type IntegrationConfig = {
  id: string;
  name: string;
  kind: IntegrationKind;
  chain: "solana" | "sui" | "cross-chain";
  address?: string;
  apiUrl?: string;
};

const value = (name: string): string | undefined => process.env[name]?.trim() || undefined;

function integration(input: Omit<IntegrationConfig, "address" | "apiUrl">, address: string | undefined, apiUrl: string | undefined): IntegrationConfig {
  return {
    ...input,
    ...(address === undefined ? {} : { address }),
    ...(apiUrl === undefined ? {} : { apiUrl }),
  };
}

export function serverIntegrations(): readonly IntegrationConfig[] {
  return [
    integration({ id: "cetus", name: "Cetus", kind: "dex", chain: "sui" }, value("POWERCHAIN_CETUS_PACKAGE_ID"), value("POWERCHAIN_CETUS_API_URL")),
    integration({ id: "orca", name: "Orca", kind: "dex", chain: "solana" }, value("POWERCHAIN_ORCA_PROGRAM_ID"), value("POWERCHAIN_ORCA_API_URL")),
    integration({ id: "walrus", name: "Walrus", kind: "storage", chain: "sui" }, value("POWERCHAIN_WALRUS_PACKAGE_ID"), value("POWERCHAIN_WALRUS_API_URL")),
    integration({ id: "meteora", name: "Meteora", kind: "dex", chain: "solana" }, value("POWERCHAIN_METEORA_PROGRAM_ID"), value("POWERCHAIN_METEORA_API_URL")),
    integration({ id: "raydium", name: "Raydium", kind: "dex", chain: "solana" }, value("POWERCHAIN_RAYDIUM_PROGRAM_ID"), value("POWERCHAIN_RAYDIUM_API_URL")),
    integration({ id: "jupiter", name: "Jupiter", kind: "dex", chain: "solana" }, value("POWERCHAIN_JUPITER_PROGRAM_ID"), value("POWERCHAIN_JUPITER_API_URL")),
    integration({ id: "wormhole", name: "Wormhole NTT", kind: "bridge", chain: "cross-chain" }, undefined, value("POWERCHAIN_WORMHOLESCAN_API_URL")),
  ];
}
