import { stakingStatus } from "@powerchain/staking";

/**
 * Server-side read-only staking readiness adapter.
 * It never signs, submits, or custodially executes staking transactions.
 */
export async function getStakingReadiness() {
  const status = await stakingStatus();
  return Object.freeze({
    ...status,
    backendSigningAuthority: false as const,
    requiresConnectedWalletSignature: true as const,
  });
}
