import { NextRequest, NextResponse } from "next/server";
import { getPwrcTransfers } from "@/server/services/pwrc-transfers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim() || "";
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") || 25);
  try {
    const data = await getPwrcTransfers(address, {
      paginationToken: request.nextUrl.searchParams.get("paginationToken"),
      limit: Number.isFinite(limitRaw) ? limitRaw : 25,
    });
    return NextResponse.json(data, {
      status: data.source === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json(
      { code: "PWRC_TRANSFER_HISTORY_UNAVAILABLE", message: "PWRC transfer history is temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" } },
    );
  }
}
