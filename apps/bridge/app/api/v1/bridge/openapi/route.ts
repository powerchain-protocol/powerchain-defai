import { NextResponse } from "next/server";
import { BRIDGE_OPENAPI } from "@/server/openapi";
export async function GET() { return NextResponse.json(BRIDGE_OPENAPI, { headers: { "Cache-Control": "public, max-age=300" } }); }
