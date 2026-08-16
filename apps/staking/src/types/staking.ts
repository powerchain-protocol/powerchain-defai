export type StakingChain = "SOLANA" | "SUI";
export type StakingState = "configured" | "disabled" | "unavailable";

export interface StakingConfiguration {
  chain: StakingChain;
  state: StakingState;
  programOrPackageId?: string;
  vaultOrPoolId?: string;
  tokenSymbol: "PWRC" | "wPWRC";
  custodyModel: "program-vault" | "shared-object" | "unconfigured";
}

export interface StakingStatus {
  configurations: readonly StakingConfiguration[];
  executable: boolean;
  advisoryOnlyUntilConfigured: boolean;
  apr?: number;
  aprSource?: string;
}
