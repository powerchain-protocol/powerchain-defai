import { NextResponse } from "next/server";
import { prisma } from "@powerchain/database/prisma";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const since = new URL(request.url).searchParams.get("after");
  const events = await prisma.bridgeAuditEvent.findMany({
    where: { target: id, event: { startsWith: "bridge." }, ...(since ? { createdAt: { gt: new Date(since) } } : {}) },
    orderBy: { createdAt: "asc" }, take: 200,
  });
  return NextResponse.json({ data: events.map((event) => ({ id: event.id, event: event.event, payload: event.payload, createdAt: event.createdAt.toISOString() })) }, { headers: { "cache-control": "no-store, max-age=0" } });
}
