import { buildCetusSwapTransaction } from "@powerchain/backend/swap/cetus";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }

export async function POST(req: Request) {
  const id = requestId(req);
  try {
    const body = record(await req.json());
    if (!body) return fail("SWAP_REQUEST_INVALID", "Invalid swap request", 422, id, false);
    const built = await buildCetusSwapTransaction({
      payer: String(body.payer ?? ""),
      fromCoinType: String(body.fromCoinType ?? ""),
      toCoinType: String(body.toCoinType ?? ""),
      amountBaseUnits: String(body.amountBaseUnits ?? ""),
      slippageBps: Number(body.slippageBps ?? 50),
      requiredMinimumOutBaseUnits: String(body.minimumOutBaseUnits ?? ""),
    });
    return ok({ ...built, userPaysNetworkFees: true, userSignatureRequired: true, gasSponsor: null }, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SWAP_TRANSACTION_BUILD_FAILED";
    return fail(code, "Unable to prepare a wallet-signed swap transaction", 422, id, false);
  }
}
