import { NextResponse } from "next/server";
import { POWERCHAIN_CLUSTERS } from "@powerchain/clusters";
import { appBaseUrl } from "@/website/lib/urls";

export const dynamic = "force-dynamic";

async function appReachability() {
  try {
    const response = await fetch(`${appBaseUrl}/api/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(1800),
      headers: { accept: "application/json" },
    });
    return response.ok;
  } catch {
    return null;
  }
}

export async function GET() {
  const reachable = await appReachability();
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    app: { baseUrl: appBaseUrl, reachable },
    clusters: POWERCHAIN_CLUSTERS,
  }, { headers: { "cache-control": "no-store" } });
}
