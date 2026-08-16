import { NextResponse } from "next/server";
import { getTokenInformation } from "@/server/services/token-information";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = getTokenInformation();
  return NextResponse.json(payload, {
    status: payload.runtime.verification.runtimeVerified ? 200 : 503,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-powerchain-information-commitment": payload.informationCommitment.digest,
      "x-powerchain-information-verified": String(payload.runtime.verification.runtimeVerified),
    },
  });
}
