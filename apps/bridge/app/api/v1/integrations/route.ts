import { NextResponse } from "next/server";
import { serverIntegrations } from "@powerchain/protocol/integrations";

export const dynamic = "force-dynamic";

export async function GET() {
  const integrations = serverIntegrations().map(({ id, name, kind, chain, address, apiUrl }) => ({
    id,
    name,
    kind,
    chain,
    configured: Boolean(address || apiUrl),
  }));
  return NextResponse.json({ integrations }, { headers: { "cache-control": "no-store" } });
}
