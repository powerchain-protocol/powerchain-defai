import { stakingStatus } from "@powerchain/staking";
import { ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  const status = await stakingStatus();
  return ok(
    { ...status, authoritativeForSettlement: false as const },
    200,
    id,
    { "x-powerchain-staking-executable": status.executable ? "true" : "false" },
  );
}
