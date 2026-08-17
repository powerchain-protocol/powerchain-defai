import { NextResponse } from "next/server";
import { enforceBridgeRuntimeRequest } from "@/server/http/bridge-runtime-guard";
import { createClaimChallenge } from "@powerchain/backend/claims";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const blocked = await enforceBridgeRuntimeRequest("claim"); if (blocked) return blocked;
  try {
    const type = request.headers.get("content-type")?.split(";",1)[0]?.toLowerCase();
    if (type !== "application/json") return NextResponse.json({ error: "UNSUPPORTED_MEDIA_TYPE" }, { status: 415 });
    const data = await createClaimChallenge((await request.json() as { wallet?: unknown }).wallet);
    return NextResponse.json({ data }, { status: 201, headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLAIM_CHALLENGE_FAILED";
    return NextResponse.json({ error: code }, { status: code.includes("ELIGIBLE") || code.includes("WALLET") ? 422 : 500, headers: { "cache-control": "no-store, max-age=0" } });
  }
}
