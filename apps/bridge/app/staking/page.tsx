import { stakingStatus } from "@powerchain/staking";
import { StakingDashboard } from "@/components/staking/staking-dashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staking" };

export default async function StakingPage() {
  const status = await stakingStatus();
  return <StakingDashboard initialStatus={status} />;
}
