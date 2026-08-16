import { stakingStatus } from "@powerchain/staking";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() { return NextResponse.json({ ...stakingStatus(), authoritativeForSettlement: false }, { headers: { "Cache-Control": "no-store" } }); }
