import { NextResponse } from "next/server";
import { checkProviderReadiness } from "@/server/services/provider-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await checkProviderReadiness();
  return NextResponse.json(result, {
    status: result.ready ? 200 : 503,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-powerchain-provider-readiness": result.ready ? (result.degraded ? "ready-degraded" : "ready") : "not-ready",
    },
  });
}
