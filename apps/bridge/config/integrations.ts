export type IntegrationDomain = "solana" | "sui" | "cross-chain" | "infrastructure";
export type IntegrationCategory = "bridge" | "liquidity" | "market-data" | "storage" | "edge";

export type PublicIntegration = Readonly<{
  id: string;
  name: string;
  domain: IntegrationDomain;
  category: IntegrationCategory;
  enabled: boolean;
  description: string;
}>;

export const integrations: readonly PublicIntegration[] = Object.freeze([
  {
    id: "wormhole",
    name: "Wormhole NTT",
    domain: "cross-chain",
    category: "bridge",
    enabled: true,
    description: "Canonical cross-chain principal movement for PWRC representations.",
  },
  {
    id: "cloudflare",
    name: "Cloudflare Workers",
    domain: "infrastructure",
    category: "edge",
    enabled: process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === "true",
    description: "Optional OpenNext Workers deployment, edge delivery and observability surface.",
  },
  {
    id: "cetus",
    name: "Cetus",
    domain: "sui",
    category: "liquidity",
    enabled: process.env.NEXT_PUBLIC_CETUS_ENABLED === "true",
    description: "Optional Sui liquidity and routing provider.",
  },
  {
    id: "orca",
    name: "Orca",
    domain: "solana",
    category: "liquidity",
    enabled: process.env.NEXT_PUBLIC_ORCA_ENABLED === "true",
    description: "Optional Solana liquidity and routing provider.",
  },
  {
    id: "walrus",
    name: "Walrus",
    domain: "sui",
    category: "storage",
    enabled: process.env.NEXT_PUBLIC_WALRUS_ENABLED === "true",
    description: "Optional Sui-native decentralized storage integration.",
  },
  {
    id: "meteora",
    name: "Meteora",
    domain: "solana",
    category: "liquidity",
    enabled: process.env.NEXT_PUBLIC_METEORA_ENABLED === "true",
    description: "Optional Solana liquidity integration.",
  },
  {
    id: "raydium",
    name: "Raydium",
    domain: "solana",
    category: "liquidity",
    enabled: process.env.NEXT_PUBLIC_RAYDIUM_ENABLED === "true",
    description: "Optional Solana liquidity and market integration.",
  },
  {
    id: "jupiter",
    name: "Jupiter",
    domain: "solana",
    category: "liquidity",
    enabled: process.env.NEXT_PUBLIC_JUPITER_ENABLED === "true",
    description: "Optional Solana swap quote and execution-routing integration.",
  },
]);
