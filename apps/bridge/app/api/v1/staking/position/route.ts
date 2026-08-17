import { fail, ok, requestId } from "@/server/http";
import { stakingPositionStatus } from "@/server/staking/position";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  const wallet = new URL(req.url).searchParams.get("wallet")?.trim();
  if (!wallet) return fail("WALLET_REQUIRED", "A Solana wallet address is required.", 400, id);
  try {
    return ok(await stakingPositionStatus(wallet), 200, id);
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "STAKING_POSITION_UNAVAILABLE";
    const status = message === "INVALID_SOLANA_WALLET_ADDRESS" ? 400 : 503;
    return fail(message, "Unable to verify the staking position.", status, id, status >= 500);
  }
}
