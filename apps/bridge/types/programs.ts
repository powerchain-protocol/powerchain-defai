import type { ProtocolProgramChain, ProtocolProgramKind } from "@powerchain/protocol/programs";

export type ProgramRuntimeState = "verified" | "verification-required" | "unconfigured" | "gated" | "unavailable";
export type ProgramEvidenceSource = "solana-rpc" | "sui-rpc" | "staking-verifier" | "escrow-verifier" | "repository" | "operator-config" | "runtime-verifier";
export type ProgramEvidenceMode = "live" | "cache";
export type ProgramDeploymentEvidence =
  | { readonly kind: "solana-loader"; readonly accountOwner: string; readonly loader: "bpf-loader-v1" | "bpf-loader-v2" | "bpf-upgradeable" | "loader-v4" }
  | { readonly kind: "sui-shared-objects"; readonly configShared: boolean; readonly informationShared: boolean };

export interface ProgramRuntimeItem {
  readonly id: "solana-bridge" | "solana-staking" | "solana-escrow" | "sui-bridge";
  readonly label: string;
  readonly chain: ProtocolProgramChain;
  readonly kind: ProtocolProgramKind;
  readonly sourcePath: string;
  readonly purpose: string;
  readonly custody: "non-custodial" | "program-vault";
  readonly principalMovement: "wormhole-ntt" | "program-vault" | "receipt-vault";
  readonly requiredForCoreBridge: boolean;
  readonly configVersion?: number;
  readonly state: ProgramRuntimeState;
  readonly configured: boolean;
  readonly verified: boolean;
  readonly executable: boolean;
  readonly timedOut: boolean;
  readonly identifier?: string;
  readonly reason?: string;
  readonly evidenceSource: ProgramEvidenceSource;
  readonly checkedAt: string;
  readonly verificationDurationMs: number;
  readonly evidenceMode: ProgramEvidenceMode;
  readonly cacheAgeMs: number;
  readonly deploymentEvidence?: ProgramDeploymentEvidence;
}

export interface ProgramReadinessPayload {
  readonly checkedAt: string;
  readonly ready: boolean;
  readonly configuredCount: number;
  readonly verifiedCount: number;
  readonly requiredCount: number;
  readonly requiredVerifiedCount: number;
  readonly executableCount: number;
  readonly unavailableCount: number;
  readonly timedOutCount: number;
  readonly programs: readonly ProgramRuntimeItem[];
  readonly authoritativeForSettlement: false;
}
