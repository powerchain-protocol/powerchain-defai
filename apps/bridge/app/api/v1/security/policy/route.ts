import { NextResponse } from "next/server";
import { publicSecurityPolicy } from "@powerchain/backend/services/security";
export const dynamic = "force-static";
export async function GET() { return NextResponse.json(publicSecurityPolicy(), { headers: { "cache-control": "public, max-age=300, s-maxage=300" } }); }
