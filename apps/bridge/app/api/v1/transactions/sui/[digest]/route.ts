import { NextResponse } from "next/server";
import { getSuiTransactionDetails } from "@/server/services/wallet-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ digest: string }> }) {
  try {
    const { digest } = await context.params;
    const data = await getSuiTransactionDetails(digest);
    if (!data) return NextResponse.json({ code: "TRANSACTION_NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ code: "SUI_TRANSACTION_UNAVAILABLE", message: error instanceof Error ? error.message : "Transaction unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
