import { fail, ok, requestId } from "@/server/http";
import { stakingTransactionStatus } from "@/server/staking/transaction-status";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, context: { params: Promise<{ signature: string }> }) {
  const id = requestId(req);
  try {
    const { signature } = await context.params;
    return ok(await stakingTransactionStatus(signature), 200, id);
  } catch (reason) {
    const code = reason instanceof Error ? reason.message : "STAKING_TRANSACTION_STATUS_UNAVAILABLE";
    const status = code === "INVALID_SOLANA_TRANSACTION_SIGNATURE" ? 400 : 503;
    return fail(code, "Unable to verify the staking transaction status.", status, id, status >= 500);
  }
}
