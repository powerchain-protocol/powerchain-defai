export type PublicIntegration = { id: string; name: string; chain: "solana" | "sui" | "cross-chain"; enabled: boolean };
export const integrations: readonly PublicIntegration[] = [
  { id: "wormhole", name: "Wormhole NTT", chain: "cross-chain", enabled: true },
  { id: "cetus", name: "Cetus", chain: "sui", enabled: Boolean(process.env.NEXT_PUBLIC_CETUS_ENABLED === "true") },
  { id: "orca", name: "Orca", chain: "solana", enabled: Boolean(process.env.NEXT_PUBLIC_ORCA_ENABLED === "true") },
  { id: "walrus", name: "Walrus", chain: "sui", enabled: Boolean(process.env.NEXT_PUBLIC_WALRUS_ENABLED === "true") },
  { id: "meteora", name: "Meteora", chain: "solana", enabled: Boolean(process.env.NEXT_PUBLIC_METEORA_ENABLED === "true") },
  { id: "raydium", name: "Raydium", chain: "solana", enabled: Boolean(process.env.NEXT_PUBLIC_RAYDIUM_ENABLED === "true") },
  { id: "jupiter", name: "Jupiter", chain: "solana", enabled: Boolean(process.env.NEXT_PUBLIC_JUPITER_ENABLED === "true") },
] as const;
