import { createJupiterSwapOrder } from "@powerchain/backend/swap/solana";
import { fail, ok, requestId } from "@/server/http";
import { jupiterRequestOverride } from "@/server/jupiter-user-override";
export const dynamic = "force-dynamic";
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }

export async function POST(req: Request) {
  const id = requestId(req);
  try {
    const body = record(await req.json());
    if (!body) return fail("SWAP_REQUEST_INVALID", "Invalid Solana swap request", 422, id, false);
    const order = await createJupiterSwapOrder({ payer: String(body.payer ?? ""), inputMint: String(body.inputMint ?? ""), outputMint: String(body.outputMint ?? ""), amountBaseUnits: String(body.amountBaseUnits ?? ""), slippageBps: Number(body.slippageBps ?? 50) }, jupiterRequestOverride(req));
    return ok(order, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SOLANA_SWAP_ORDER_FAILED";
    const unavailable = code.includes("UNAVAILABLE") || code.includes("JUPITER_API_KEY") || code.includes("JUPITER_CUSTOM_API");
    return fail(code, unavailable ? "Solana swap routing is temporarily unavailable" : "Unable to prepare Solana swap order", unavailable ? 503 : 422, id, unavailable);
  }
}
