import { NextResponse } from "next/server";
import { getClaimEligibility } from "@/server/services/claim-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const wallet = new URL(request.url).searchParams.get("wallet");
    const data = await getClaimEligibility(wallet);
    return NextResponse.json({ data }, { headers: { "cache-control": "no-store, max-age=0" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CLAIM_ELIGIBILITY_FAILED";
    return NextResponse.json({ error: code }, { status: code === "WALLET_REQUIRED" ? 400 : 500, headers: { "cache-control": "no-store, max-age=0" } });
  }
}
