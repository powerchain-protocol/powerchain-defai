import { NextResponse } from "next/server";
import { prisma } from "@powerchain/database/prisma";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = url.searchParams.get("address")?.trim() || null;
  const status = url.searchParams.get("status")?.trim().toUpperCase() || null;
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 25)));
  const cursor = url.searchParams.get("cursor")?.trim() || null;
  const rows = await prisma.bridgeTransfer.findMany({
    where: {
      ...(address ? { OR: [{ sourceAddress: address }, { destinationAddress: address }] } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const hasNextPage = rows.length > limit;
  const page = hasNextPage ? rows.slice(0, limit) : rows;
  return NextResponse.json({ data: page.map((row) => ({
    id: row.id, routeId: row.routeId, direction: row.direction, status: row.status, principalBaseUnits: row.principalBaseUnits.toFixed(0),
    sourceAddress: row.sourceAddress, destinationAddress: row.destinationAddress, sourceTx: row.sourceTx, destinationTx: row.destinationTx,
    createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  })), pagination: { nextCursor: hasNextPage ? page.at(-1)?.id ?? null : null, hasNextPage } }, { headers: { "cache-control": "no-store, max-age=0" } });
}
