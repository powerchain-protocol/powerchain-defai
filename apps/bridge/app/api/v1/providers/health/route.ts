import { NextResponse } from "next/server";
import { checkProviderHealth } from "@/server/services/provider-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const result = await checkProviderHealth();
  return NextResponse.json(result, {
    status: result.status === "unavailable" ? 503 : 200,
    headers: {
      "cache-control": "no-store, max-age=0",
      "x-content-type-options": "nosniff",
      "x-powerchain-provider-status": result.status,
    },
  });
}
