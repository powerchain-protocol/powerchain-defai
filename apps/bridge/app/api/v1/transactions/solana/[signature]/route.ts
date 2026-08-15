import { NextResponse } from "next/server";
import { getSolanaTransactionDetails } from "@/server/services/wallet-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ signature: string }> }) {
  try {
    const { signature } = await context.params;
    const data = await getSolanaTransactionDetails(signature);
    if (!data) return NextResponse.json({ code: "TRANSACTION_NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ code: "SOLANA_TRANSACTION_UNAVAILABLE", message: error instanceof Error ? error.message : "Transaction unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
