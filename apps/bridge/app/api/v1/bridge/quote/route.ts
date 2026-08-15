import { NextResponse } from "next/server";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { validateBridgeMutationRequest } from "@/server/http/bridge-mutation-contract";
import { issueBridgeQuote } from "@/server/services/bridge-operations";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const contract = await validateBridgeMutationRequest(request, "quote");
  if (!contract.ok) return contract.response;
  const runtimeBlocked = await enforceBridgeRuntimeRequest("quote");
  if (runtimeBlocked) return runtimeBlocked;
  try {
    const quote = await issueBridgeQuote(await request.json());
    return NextResponse.json({ data: quote, requestId: contract.context.requestId }, { status: 201, headers: { "cache-control": "no-store, max-age=0", "x-request-id": contract.context.requestId } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "QUOTE_FAILED";
    const status = code.includes("INVALID") || code.includes("REQUIRED") || code.includes("UNSUPPORTED") ? 422 : code.includes("UNAVAILABLE") || code.includes("BLOCKED") ? 503 : 500;
    return NextResponse.json({ error: code, requestId: contract.context.requestId }, { status, headers: { "cache-control": "no-store, max-age=0", "x-request-id": contract.context.requestId } });
  }
}
