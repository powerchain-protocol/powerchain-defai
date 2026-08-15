import "server-only";
import { prisma } from "@powerchain/database/prisma";
import type { PersistedOperationStatus } from "./operation-status-service";

function bridgeStatus(status: string): PersistedOperationStatus["status"] {
  if (status === "COMPLETED") return "FINALIZED";
  if (status === "SOURCE_SUBMITTING" || status === "SOURCE_SUBMITTED") return "SUBMITTED";
  if (status === "MESSAGE_OBSERVED") return "SOURCE_FINALIZED";
  if (["CREATED","SOURCE_FINALIZED","DESTINATION_SUBMITTED","DESTINATION_FINALIZED","RECONCILIATION_REQUIRED","FAILED"].includes(status)) {
    return status === "CREATED" ? "PREPARING" : status as PersistedOperationStatus["status"];
  }
  return "UNKNOWN";
}

function claimStatus(status: string): PersistedOperationStatus["status"] {
  if (status === "FINALIZED") return "FINALIZED";
  if (status === "RESERVED") return "RESERVED";
  if (status === "SUBMITTING") return "SIGNING";
  if (status === "SUBMITTED") return "SUBMITTED";
  if (status === "FAILED") return "FAILED";
  if (status === "UNKNOWN") return "UNKNOWN";
  if (status === "EXPIRED") return "FAILED";
  return "UNKNOWN";
}

export async function loadBridgeOperationStatus(id: string): Promise<PersistedOperationStatus | null> {
  const row = await prisma.bridgeTransfer.findUnique({ where: { id }, select: { id: true, status: true, updatedAt: true } });
  if (!row) return null;
  return { kind: "bridge", id: row.id, status: bridgeStatus(row.status), revision: Math.max(0, Math.floor(row.updatedAt.getTime() / 1000)), observedAt: row.updatedAt.toISOString() };
}

export async function loadClaimOperationStatus(id: string): Promise<PersistedOperationStatus | null> {
  const row = await prisma.claim.findUnique({ where: { id }, select: { id: true, status: true, updatedAt: true } });
  if (!row) return null;
  return { kind: "claim", id: row.id, status: claimStatus(row.status), revision: Math.max(0, Math.floor(row.updatedAt.getTime() / 1000)), observedAt: row.updatedAt.toISOString() };
}
