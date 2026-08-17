import { NextResponse } from "next/server";
import { getSuiTransactionDetails } from "@/server/services/wallet-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ digest: string }> }) {
  try {
    const { digest } = await context.params;
    const data = await getSuiTransactionDetails(digest);
    if (!data) return NextResponse.json({ code: "TRANSACTION_NOT_FOUND" }, { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ code: "SUI_TRANSACTION_UNAVAILABLE", message: "Sui transaction details are temporarily unavailable" }, { status: 503, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } });
  }
}
