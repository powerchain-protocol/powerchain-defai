import { NextResponse } from "next/server";
import { getWorkerReadiness } from "@powerchain/database";
import { parseBoundedInteger } from "@powerchain/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const maxAgeMs = parseBoundedInteger(process.env.POWERCHAIN_WORKER_HEARTBEAT_MAX_AGE_MS, 60_000, { min: 5_000, max: 300_000 });
    const status = await getWorkerReadiness({ maxAgeMs });
    return NextResponse.json(
      { ...status, checkedAt: new Date().toISOString() },
      {
        status: status.ready ? 200 : 503,
        headers: {
          "cache-control": "no-store, max-age=0",
          "x-content-type-options": "nosniff",
          "x-powerchain-workers": status.ready ? "ready" : "not-ready",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { ready: false, workers: [], checkedAt: new Date().toISOString() },
      { status: 503, headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff", "x-powerchain-workers": "unavailable" } },
    );
  }
}
