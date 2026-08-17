import { STAKING_ENV, STAKING_RUNTIME_POLICY } from "../config";
import type { StakingStatus } from "../types/staking";
import { suiStakingConfiguration, verifySolanaStakingDeployment } from "../verification";

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}
function list(...names: string[]): string[] {
  const result: string[] = [];
  for (const name of names) {
    for (const raw of (process.env[name] ?? "").split(",")) {
      const value = raw.trim();
      if (value && !result.includes(value)) result.push(value);
    }
  }
  return result;
}

export async function stakingStatus(options: { readonly signal?: AbortSignal } = {}): Promise<StakingStatus> {
  const checkedAt = new Date().toISOString();
  const solanaRpcUrl = optional(STAKING_ENV.solanaRpcUrl);
  const solanaRpcFallbacks = list(STAKING_ENV.solanaRpcFallbackUrl, STAKING_ENV.solanaRpcFallbackUrls);
  const solanaProgramId = optional(STAKING_ENV.solanaProgramId);
  const solanaConfig = optional(STAKING_ENV.solanaConfig);
  const solanaStakeVault = optional(STAKING_ENV.solanaStakeVault);
  const solanaRewardVault = optional(STAKING_ENV.solanaRewardVault);
  const suiPackageId = optional(STAKING_ENV.suiPackageId);
  const suiPoolObjectId = optional(STAKING_ENV.suiPoolObjectId);
  const suiRewardPoolObjectId = optional(STAKING_ENV.suiRewardPoolObjectId);
  const suiCoinType = optional(STAKING_ENV.suiCoinType);

  const solana = await verifySolanaStakingDeployment({
    ...(solanaRpcUrl === undefined ? {} : { rpcUrl: solanaRpcUrl }),
    ...(solanaRpcFallbacks.length ? { rpcUrls: solanaRpcFallbacks } : {}),
    ...(solanaProgramId === undefined ? {} : { programId: solanaProgramId }),
    ...(solanaConfig === undefined ? {} : { configAddress: solanaConfig }),
    ...(solanaStakeVault === undefined ? {} : { stakeVault: solanaStakeVault }),
    ...(solanaRewardVault === undefined ? {} : { rewardVault: solanaRewardVault }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
  });
  const sui = suiStakingConfiguration({
    ...(suiPackageId === undefined ? {} : { packageId: suiPackageId }),
    ...(suiPoolObjectId === undefined ? {} : { poolObjectId: suiPoolObjectId }),
    ...(suiRewardPoolObjectId === undefined ? {} : { rewardPoolObjectId: suiRewardPoolObjectId }),
    ...(suiCoinType === undefined ? {} : { coinType: suiCoinType }),
  });
  const configurations = [solana, sui] as const;
  const executable = configurations.some((item) => item.executable);
  return { configurations, executable, advisoryOnlyUntilConfigured: !executable, policy: STAKING_RUNTIME_POLICY, checkedAt };
}
