import { NextResponse } from "next/server";
import { checkDatabaseReady } from "@powerchain/database";
import { checkProviderReadiness } from "@/server/services/provider-health";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  const [database, providers] = await Promise.allSettled([checkDatabaseReady(), checkProviderReadiness()]);
  const dbReady = database.status === "fulfilled";
  const providerReady = providers.status === "fulfilled" && providers.value.ready;
  const ready = dbReady && providerReady;
  return NextResponse.json({ ready, checkedAt: new Date().toISOString(), database: { ready: dbReady }, providers: providers.status === "fulfilled" ? providers.value : { ready: false } }, { status: ready ? 200 : 503, headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff", "x-powerchain-readiness": ready ? "ready" : "not-ready" } });
}
