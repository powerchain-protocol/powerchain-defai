import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export function GET() {
  return NextResponse.json({ ok: true, service: "powerchain-bridge", version: "1.0.0", checkedAt: new Date().toISOString() }, { headers: { "cache-control": "no-store, max-age=0", "x-content-type-options": "nosniff" } });
}
