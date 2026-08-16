import { NextResponse } from "next/server";
import { getOperationsStatus } from "@powerchain/backend/services/operations";
import { parseBoundedInteger } from "@powerchain/runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const maxWorkerAgeMs = parseBoundedInteger(process.env.POWERCHAIN_WORKER_HEARTBEAT_MAX_AGE_MS, 60_000, { min: 5_000, max: 300_000 });
    const status = await getOperationsStatus({ maxWorkerAgeMs });
    return NextResponse.json(status, {
      status: status.state === "blocked" ? 503 : 200,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-content-type-options": "nosniff",
        "x-powerchain-operations": status.state,
      },
    });
  } catch {
    return NextResponse.json(
      { state: "blocked", database: { ready: false }, workers: { ready: false, maxAgeMs: 60_000, workers: [] }, queues: [], checkedAt: new Date().toISOString(), authoritativeForBridgeAccounting: false },
      { status: 503, headers: { "cache-control": "no-store, max-age=0", "retry-after": "5", "x-powerchain-operations": "blocked" } },
    );
  }
}
