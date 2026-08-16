export type PowerChainEcosystemModuleId = "chat" | "swap" | "bridge" | "staking" | "portfolio" | "liquidity" | "assets" | "fees";

export interface PowerChainEcosystemModule {
  id: PowerChainEcosystemModuleId;
  label: string;
  href: string;
  description: string;
  executionAuthority: "wallet" | "none";
  settlementAuthority: "wormhole-ntt" | "dex-protocol" | "staking-program" | "none";
  aiMayExecute: false;
}

export const POWERCHAIN_ECOSYSTEM: readonly PowerChainEcosystemModule[] = [
  { id: "chat", label: "AI Assistant", href: "/chat", description: "Read-only DeFi planning, explanation, route comparison and risk context.", executionAuthority: "none", settlementAuthority: "none", aiMayExecute: false },
  { id: "swap", label: "Swap", href: "/swap", description: "Wallet-signed swaps across Solana and Sui routing providers.", executionAuthority: "wallet", settlementAuthority: "dex-protocol", aiMayExecute: false },
  { id: "bridge", label: "Bridge", href: "/bridge", description: "PWRC ↔ wPWRC cross-chain principal movement through Wormhole NTT.", executionAuthority: "wallet", settlementAuthority: "wormhole-ntt", aiMayExecute: false },
  { id: "staking", label: "Staking", href: "/staking", description: "Governed PWRC/wPWRC staking surface, disabled until on-chain deployment is configured.", executionAuthority: "wallet", settlementAuthority: "staking-program", aiMayExecute: false },
  { id: "portfolio", label: "Portfolio", href: "/assets", description: "Connected-wallet balances, positions and portfolio analytics.", executionAuthority: "none", settlementAuthority: "none", aiMayExecute: false },
  { id: "liquidity", label: "Liquidity", href: "/assets#liquidity", description: "Pool and LP observations across supported DEX integrations.", executionAuthority: "none", settlementAuthority: "dex-protocol", aiMayExecute: false },
  { id: "assets", label: "Assets", href: "/assets", description: "Canonical PWRC/wPWRC identity and trusted-token registry.", executionAuthority: "none", settlementAuthority: "none", aiMayExecute: false },
  { id: "fees", label: "Fees", href: "/fees", description: "Network, service, Token-2022 and liquidity fee disclosures.", executionAuthority: "none", settlementAuthority: "none", aiMayExecute: false }
] as const;

export function ecosystemModule(id: PowerChainEcosystemModuleId): PowerChainEcosystemModule {
  const module = POWERCHAIN_ECOSYSTEM.find((item) => item.id === id);
  if (!module) throw new Error(`Unknown PowerChain ecosystem module: ${id}`);
  return module;
}
