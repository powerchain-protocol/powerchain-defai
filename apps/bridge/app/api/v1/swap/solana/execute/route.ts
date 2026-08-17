import { executeJupiterSwap } from "@powerchain/backend/swap/solana";
import { fail, ok, requestId } from "@/server/http";
import { jupiterRequestOverride } from "@/server/jupiter-user-override";
export const dynamic = "force-dynamic";
function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }

export async function POST(req: Request) {
  const id = requestId(req);
  try {
    const body = record(await req.json());
    if (!body) return fail("SWAP_REQUEST_INVALID", "Invalid signed swap request", 422, id, false);
    const result = await executeJupiterSwap({ payer: String(body.payer ?? ""), signedTransaction: String(body.signedTransaction ?? ""), requestId: String(body.requestId ?? ""), lastValidBlockHeight: typeof body.lastValidBlockHeight === "number" ? body.lastValidBlockHeight : null, inputMint: String(body.inputMint ?? ""), outputMint: String(body.outputMint ?? ""), amountBaseUnits: String(body.amountBaseUnits ?? ""), slippageBps: Number(body.slippageBps ?? 50), minimumOutputBaseUnits: typeof body.minimumOutputBaseUnits === "string" ? body.minimumOutputBaseUnits : null }, jupiterRequestOverride(req));
    return ok(result, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SOLANA_SWAP_EXECUTE_FAILED";
    const unavailable = code.includes("JUPITER_API_KEY") || code.includes("JUPITER_CUSTOM_API");
    return fail(code, unavailable ? "Jupiter execution is unavailable for the selected provider configuration" : "Signed Solana swap could not be executed", unavailable ? 503 : 422, id, unavailable);
  }
}
