import { NextResponse } from "next/server";
import { SWAP_OPENAPI } from "@/server/openapi";
export async function GET() { return NextResponse.json(SWAP_OPENAPI, { headers: { "Cache-Control": "public, max-age=300" } }); }
