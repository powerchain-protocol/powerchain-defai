import "server-only";

import { prisma } from "@powerchain/database/prisma";

function record(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export type BridgeEventSnapshot = {
  transferId: string;
  status: string;
  version: number;
  events: Array<{
    id: string;
    event: string;
    status?: string;
    payload: unknown;
    createdAt: string;
  }>;
};

export async function loadBridgeEventSnapshot(
  transferId: string,
  options: { cursor?: string | null; after?: Date | null; limit?: number } = {},
): Promise<BridgeEventSnapshot> {
  if (!/^[0-9a-f-]{36}$/i.test(transferId)) throw new Error("INVALID_TRANSFER_ID");
  const limit = Math.max(1, Math.min(200, options.limit ?? 50));
  const transfer = await prisma.bridgeTransfer.findUnique({
    where: { id: transferId },
    select: { id: true, status: true, updatedAt: true },
  });
  if (!transfer) throw new Error("TRANSFER_NOT_FOUND");

  let after = options.after ?? null;
  let cursorId: string | null = null;
  if (options.cursor) {
    const cursor = await prisma.bridgeAuditEvent.findFirst({
      where: { id: options.cursor, target: transferId, event: { startsWith: "bridge." } },
      select: { id: true, createdAt: true },
    });
    if (cursor) {
      after = cursor.createdAt;
      cursorId = cursor.id;
    }
  }

  const events = await prisma.bridgeAuditEvent.findMany({
    where: {
      target: transferId,
      event: { startsWith: "bridge." },
      ...(after ? {
        OR: [
          { createdAt: { gt: after } },
          ...(cursorId ? [{ createdAt: after, id: { gt: cursorId } }] : []),
        ],
      } : {}),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
  });

  return {
    transferId,
    status: transfer.status,
    version: Math.max(0, Math.floor(transfer.updatedAt.getTime() / 1000)),
    events: events.map((event) => {
      const payload = record(event.payload);
      const status = typeof payload?.status === "string" ? payload.status : undefined;
      return {
        id: event.id,
        event: event.event,
        ...(status ? { status } : {}),
        payload: event.payload,
        createdAt: event.createdAt.toISOString(),
      };
    }),
  };
}
