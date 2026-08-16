import { createCetusSwapQuote } from "@powerchain/backend/swap/cetus";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }

export async function POST(req: Request) {
  const id = requestId(req);
  try {
    const body = record(await req.json());
    if (!body) return fail("SWAP_REQUEST_INVALID", "Invalid swap request", 422, id, false);
    const quote = await createCetusSwapQuote({
      payer: String(body.payer ?? ""),
      fromCoinType: String(body.fromCoinType ?? ""),
      toCoinType: String(body.toCoinType ?? ""),
      amountBaseUnits: String(body.amountBaseUnits ?? ""),
      slippageBps: Number(body.slippageBps ?? 50),
    });
    return ok(quote.quote, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "SWAP_QUOTE_FAILED";
    const unavailable = code.includes("UNAVAILABLE") || code.includes("LIQUIDITY") || code.includes("CONFIGURED");
    return fail(code, unavailable ? "Swap route is currently unavailable" : "Unable to create a valid swap quote", unavailable ? 503 : 422, id, unavailable);
  }
}
