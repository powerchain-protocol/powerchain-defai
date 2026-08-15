export type IntegrationKind = "dex" | "storage" | "bridge" | "oracle" | "explorer";
export type IntegrationConfig = { id: string; name: string; kind: IntegrationKind; chain: "solana" | "sui" | "cross-chain"; address?: string; apiUrl?: string };

const value = (name: string) => process.env[name]?.trim() || undefined;

export function serverIntegrations(): readonly IntegrationConfig[] {
  return [
    { id: "cetus", name: "Cetus", kind: "dex", chain: "sui", address: value("POWERCHAIN_CETUS_PACKAGE_ID"), apiUrl: value("POWERCHAIN_CETUS_API_URL") },
    { id: "orca", name: "Orca", kind: "dex", chain: "solana", address: value("POWERCHAIN_ORCA_PROGRAM_ID"), apiUrl: value("POWERCHAIN_ORCA_API_URL") },
    { id: "walrus", name: "Walrus", kind: "storage", chain: "sui", address: value("POWERCHAIN_WALRUS_PACKAGE_ID"), apiUrl: value("POWERCHAIN_WALRUS_API_URL") },
    { id: "meteora", name: "Meteora", kind: "dex", chain: "solana", address: value("POWERCHAIN_METEORA_PROGRAM_ID"), apiUrl: value("POWERCHAIN_METEORA_API_URL") },
    { id: "raydium", name: "Raydium", kind: "dex", chain: "solana", address: value("POWERCHAIN_RAYDIUM_PROGRAM_ID"), apiUrl: value("POWERCHAIN_RAYDIUM_API_URL") },
    { id: "jupiter", name: "Jupiter", kind: "dex", chain: "solana", address: value("POWERCHAIN_JUPITER_PROGRAM_ID"), apiUrl: value("POWERCHAIN_JUPITER_API_URL") },
    { id: "wormhole", name: "Wormhole NTT", kind: "bridge", chain: "cross-chain", apiUrl: value("POWERCHAIN_WORMHOLESCAN_API_URL") },
  ];
}
