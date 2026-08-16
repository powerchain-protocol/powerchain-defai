import type { StakingConfiguration, StakingStatus } from "../types/staking";

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function stakingStatus(): StakingStatus {
  const solanaProgram = optional("POWERCHAIN_SOLANA_STAKING_PROGRAM_ID");
  const solanaVault = optional("POWERCHAIN_SOLANA_STAKING_VAULT");
  const suiPackage = optional("POWERCHAIN_SUI_STAKING_PACKAGE_ID");
  const suiPool = optional("POWERCHAIN_SUI_STAKING_POOL_OBJECT_ID");
  const configurations: StakingConfiguration[] = [
    { chain: "SOLANA", state: solanaProgram && solanaVault ? "configured" : "disabled", programOrPackageId: solanaProgram, vaultOrPoolId: solanaVault, tokenSymbol: "PWRC", custodyModel: solanaProgram && solanaVault ? "program-vault" : "unconfigured" },
    { chain: "SUI", state: suiPackage && suiPool ? "configured" : "disabled", programOrPackageId: suiPackage, vaultOrPoolId: suiPool, tokenSymbol: "wPWRC", custodyModel: suiPackage && suiPool ? "shared-object" : "unconfigured" }
  ];
  return { configurations, executable: configurations.some((item) => item.state === "configured"), advisoryOnlyUntilConfigured: true };
}
