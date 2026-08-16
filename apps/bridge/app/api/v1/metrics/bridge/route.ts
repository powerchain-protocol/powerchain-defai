import { NextResponse } from "next/server";
import { getBridgeMetrics } from "@/server/services/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_WINDOW_HOURS = 24 * 30;

function parseWindowHours(value: string | null): { ok: true; value?: number } | { ok: false } {
  if (value === null || value.trim() === "") return { ok: true };
  if (!/^\d+$/.test(value)) return { ok: false };
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > MAX_WINDOW_HOURS) return { ok: false };
  return { ok: true, value: parsed };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedWindow = parseWindowHours(url.searchParams.get("windowHours"));
  if (!requestedWindow.ok) {
    return NextResponse.json(
      { error: "BRIDGE_METRICS_WINDOW_INVALID", message: `windowHours must be an integer between 1 and ${MAX_WINDOW_HOURS}` },
      { status: 400, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }

  try {
    const metrics = await getBridgeMetrics({ windowHours: requestedWindow.value });
    return NextResponse.json(metrics, {
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-powerchain-metrics-source": "persisted-bridge-database",
        "x-powerchain-metrics-window-hours": String(metrics.windowHours),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "BRIDGE_METRICS_UNAVAILABLE" },
      { status: 503, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
