import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({ name: "PowerChain Bridge", version: "1.0.0", api: "v1" }, { headers: { "cache-control": "public, max-age=300, stale-while-revalidate=3600", "x-content-type-options": "nosniff" } });
}
