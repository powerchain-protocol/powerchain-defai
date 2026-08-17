export type StakingChain = "SOLANA" | "SUI";
export type StakingState = "configured" | "disabled" | "verification-required" | "unavailable";
export type StakingVerificationStatus = "verified" | "unverified" | "unavailable" | "invalid";
export type StakingVerificationSource = "repository" | "solana-rpc" | "sui-runtime" | "operator-config";
export type StakingRewardModel = "fixed-pool";
export type StakingCustodyModel = "program-vault" | "shared-object" | "unconfigured";

export interface StakingVerificationEvidence {
  readonly status: StakingVerificationStatus;
  readonly source: StakingVerificationSource;
  readonly detail: string;
  readonly checkedAt?: string;
}

export interface StakingIdentifier {
  readonly name: "program" | "package" | "config" | "stake-vault" | "reward-vault" | "pool" | "reward-pool" | "mint" | "coin-type" | "token-program";
  readonly value: string;
  readonly evidence: StakingVerificationEvidence;
}

export interface StakingRewardRate {
  /** Integer parts-per-million of staked principal accrued per configured epoch. Not APR/APY. */
  readonly ppmPerEpoch: string;
  readonly epochSlots: string;
  readonly source: "on-chain-config";
  readonly evidence: StakingVerificationEvidence;
}

export interface StakingRewardSource {
  readonly model: StakingRewardModel;
  readonly tokenSymbol: "PWRC" | "wPWRC";
  /** Present only after the deployed configuration has been verified. */
  readonly allocationCapBaseUnits?: string;
  readonly allocationPolicy: "on-chain-configured-cap";
  readonly sourceType: "program-reward-vault" | "shared-reward-pool" | "unconfigured";
  readonly rewardAssetIdentifier?: string;
  readonly sourceIdentifier?: string;
  readonly fundedBaseUnits?: string;
  readonly distributedBaseUnits?: string;
  readonly availableBaseUnits?: string;
  readonly rate?: StakingRewardRate;
  readonly evidence: StakingVerificationEvidence;
}


export interface StakingPoolMetrics {
  readonly totalStakedBaseUnits: string;
  readonly minStakeBaseUnits: string;
  readonly cooldownSlots: string;
  readonly source: "on-chain-config";
  readonly evidence: StakingVerificationEvidence;
}

export interface StakingRuntimePolicy {
  readonly connectedWalletSigns: true;
  readonly backendCustody: false;
  readonly fabricatedAprAllowed: false;
  readonly fabricatedRewardRateAllowed: false;
  readonly runtimeVerificationRequired: true;
}

export interface StakingConfiguration {
  readonly chain: StakingChain;
  readonly state: StakingState;
  readonly tokenSymbol: "PWRC" | "wPWRC";
  readonly custodyModel: StakingCustodyModel;
  readonly identifiers: readonly StakingIdentifier[];
  readonly rewardSource: StakingRewardSource;
  readonly deploymentEvidence: StakingVerificationEvidence;
  readonly poolMetrics?: StakingPoolMetrics;
  readonly executable: boolean;
  readonly paused?: boolean;
  readonly reason?: string;
}

export interface StakingStatus {
  readonly configurations: readonly StakingConfiguration[];
  readonly executable: boolean;
  readonly advisoryOnlyUntilConfigured: boolean;
  readonly policy: StakingRuntimePolicy;
  readonly checkedAt: string;
}


export interface SolanaStakePositionSnapshot {
  readonly owner: string;
  readonly stakedBaseUnits: string;
  readonly pendingUnstakeBaseUnits: string;
  readonly accruedRewardsBaseUnits: string;
  readonly lastRewardSlot: string;
  readonly unstakeAvailableSlot: string;
  readonly bump: number;
  readonly version: number;
}

export interface StakingPositionStatus {
  readonly chain: "SOLANA";
  readonly walletAddress: string;
  readonly positionAddress: string;
  readonly exists: boolean;
  readonly executable: boolean;
  readonly currentSlot?: string;
  readonly snapshot?: SolanaStakePositionSnapshot;
  readonly cooldownComplete?: boolean;
  readonly reason?: string;
  readonly checkedAt: string;
}

export interface SolanaStakingConfigSnapshot {
  readonly authority: string;
  readonly mint: string;
  readonly stakeVault: string;
  readonly rewardVault: string;
  readonly rewardAllocationCapBaseUnits: string;
  readonly totalRewardsFundedBaseUnits: string;
  readonly totalRewardsDistributedBaseUnits: string;
  readonly totalStakedBaseUnits: string;
  readonly rewardRatePpmPerEpoch: string;
  readonly epochSlots: string;
  readonly cooldownSlots: string;
  readonly minStakeBaseUnits: string;
  readonly paused: boolean;
  readonly version: number;
}

export type StakingTransactionAction = "initialize" | "stake" | "unstake" | "withdraw" | "claim";
export type StakingTransactionState = "submitted" | "processed" | "confirmed" | "finalized" | "failed" | "not_found";

export interface StakingTransactionStatus {
  readonly chain: "SOLANA";
  readonly signature: string;
  readonly state: Exclude<StakingTransactionState, "submitted">;
  readonly slot?: string;
  readonly confirmationStatus?: "processed" | "confirmed" | "finalized";
  readonly error?: unknown;
  readonly source?: string;
  readonly checkedAt: string;
}

export interface StakingTransactionJournalEntry {
  readonly id: string;
  readonly walletAddress: string;
  readonly action: StakingTransactionAction;
  readonly signature: string;
  readonly state: StakingTransactionState;
  readonly amountBaseUnits?: string;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly slot?: string;
  readonly error?: string;
}

