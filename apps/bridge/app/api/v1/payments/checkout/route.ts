import { buildCheckoutPlan, type CheckoutRequest } from "@powerchain/backend/payments/checkout";
import { json, ok, problem, requestId } from "@/server/http";

export async function POST(req: Request) {
  const id = requestId(req);
  let body: unknown;
  try { body = await json(req); }
  catch (reason) {
    const code = reason instanceof Error ? reason.message : "INVALID_JSON";
    return problem(code, "Invalid checkout request", code === "PAYLOAD_TOO_LARGE" ? 413 : code === "UNSUPPORTED_MEDIA_TYPE" ? 415 : 400, id);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return problem("INVALID_BODY", "Invalid checkout request", 400, id);
  try {
    return ok(await buildCheckoutPlan(body as CheckoutRequest), 200, id, { "cache-control": "no-store" });
  } catch (reason) {
    const code = reason instanceof Error ? reason.message : "CHECKOUT_UNAVAILABLE";
    const unavailable = code.startsWith("ESCROW_RPC_") || code.startsWith("ESCROW_PROGRAM_") || code.startsWith("POWERCHAIN_SOLANA_RPC_") || code.startsWith("ESCROW_CHECKOUT_VERIFICATION_FAILED");
    const conflict = code === "ESCROW_MINT_NOT_ALLOWED" || code === "ESCROW_CHECKOUT_ACCOUNT_NOT_FOUND" || code.includes("RELATION_MISMATCH") || code.includes("OWNER_MISMATCH") || code.includes("DISCRIMINATOR_MISMATCH") || code.includes("PDA_MISMATCH") || code.includes("VERSION_UNSUPPORTED");
    const status = unavailable ? 503 : conflict ? 409 : 400;
    return problem(code, unavailable ? "Escrow checkout verification is unavailable" : conflict ? "Escrow checkout target is not eligible" : "Invalid checkout request", status, id, unavailable);
  }
}
