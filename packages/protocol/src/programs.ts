export type ProtocolProgramChain = "solana" | "sui";
export type ProtocolProgramKind = "bridge" | "staking" | "escrow";

export type ProtocolProgramSource = Readonly<{
  id: "solana-bridge" | "solana-staking" | "solana-escrow" | "sui-bridge";
  label: string;
  chain: ProtocolProgramChain;
  kind: ProtocolProgramKind;
  sourcePath: string;
  purpose: string;
  custody: "non-custodial" | "program-vault";
  principalMovement: "wormhole-ntt" | "program-vault" | "receipt-vault";
  requiredForCoreBridge: boolean;
  configVersion?: number;
}>;

/** Source-controlled program inventory only. Runtime deployment is verified separately. */
export const PROTOCOL_PROGRAMS: readonly ProtocolProgramSource[] = Object.freeze([
  {
    id: "solana-bridge",
    label: "PowerChain Bridge Guard",
    chain: "solana",
    kind: "bridge",
    sourcePath: "programs/solana/powerchain_bridge",
    purpose: "Auxiliary intent, pause and information-commitment guard for the Wormhole NTT bridge flow.",
    custody: "non-custodial",
    principalMovement: "wormhole-ntt",
    requiredForCoreBridge: true,
    configVersion: 1,
  },
  {
    id: "solana-staking",
    label: "PowerChain Staking",
    chain: "solana",
    kind: "staking",
    sourcePath: "programs/solana/powerchain_staking",
    purpose: "Wallet-owned staking positions backed by program vaults and a funded reward pool.",
    custody: "program-vault",
    principalMovement: "program-vault",
    requiredForCoreBridge: false,
  },
  {
    id: "solana-escrow",
    label: "PowerChain Escrow",
    chain: "solana",
    kind: "escrow",
    sourcePath: "programs/solana/powerchain_escrow",
    purpose: "Receipt-based token escrow with mint allowlisting, timelocks and optional external hooks.",
    custody: "program-vault",
    principalMovement: "receipt-vault",
    requiredForCoreBridge: false,
  },
  {
    id: "sui-bridge",
    label: "PowerChain Sui Bridge Guard",
    chain: "sui",
    kind: "bridge",
    sourcePath: "contracts/sui/powerchain_bridge",
    purpose: "Auxiliary Sui intent, pause and information-commitment guard; Wormhole NTT remains principal settlement.",
    custody: "non-custodial",
    principalMovement: "wormhole-ntt",
    requiredForCoreBridge: true,
    configVersion: 1,
  },
]);
