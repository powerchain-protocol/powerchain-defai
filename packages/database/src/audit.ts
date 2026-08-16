import { randomUUID } from "node:crypto";
import type { PrismaJsonValue, PrismaTransactionClient } from "./prisma";

export async function writeBridgeAuditEvent(
  tx: PrismaTransactionClient,
  input: {
    event: string;
    actor: string;
    target: string;
    payload: PrismaJsonValue;
  },
) {
  return tx.bridgeAuditEvent.create({
    data: {
      id: randomUUID(),
      event: input.event,
      actor: input.actor,
      target: input.target,
      payload: input.payload,
    },
  });
}
