import { NextResponse } from "next/server";
import { getSolanaRpc, getSuiRpc } from "@/server/rpc/providers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function snapshot() {
  const solana = getSolanaRpc();
  const sui = getSuiRpc();
  return {
    generatedAt: new Date().toISOString(),
    processLocal: true,
    authoritativeForAccounting: false,
    chains: {
      solana: { pool: solana.pool.poolSnapshot(), metrics: solana.client.metrics() },
      sui: { pool: sui.pool.poolSnapshot(), metrics: sui.client.metrics() },
    },
  };
}

export async function GET() {
  try {
    return NextResponse.json(snapshot(), {
      status: 200,
      headers: {
        "cache-control": "no-store, max-age=0",
        "x-content-type-options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), processLocal: true, available: false },
      { status: 503, headers: { "cache-control": "no-store, max-age=0" } },
    );
  }
}
