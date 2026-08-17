import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET() {
  return NextResponse.json({ ok: true, service: "powerchain-defai", version: "1.0.0", checkedAt: new Date().toISOString() }, { headers: NO_STORE_HEADERS });
}
