import { OperationKind, OperationStatus, isOperationStatus } from "../../lib/bridge/operation-journal";
import { operationStatusResponse } from "./operation-status-snapshot";

export type PersistedOperationStatus = {
  kind: OperationKind;
  id: string;
  status: OperationStatus | "COMPLETED";
  revision: number;
  observedAt?: string;
};

export type OperationStatusLoader = (kind: OperationKind, id: string) => Promise<PersistedOperationStatus | null>;

const NO_STORE_HEADERS = {
  "cache-control": "no-store, max-age=0",
  "x-content-type-options": "nosniff",
};

function errorResponse(status: number, code: string) {
  return Response.json({ error: { code } }, { status, headers: NO_STORE_HEADERS });
}

/**
 * Canonical GET-status adapter for both bridge transfers and claims.
 * The loader must read persisted server state; this helper never retries or mutates an operation.
 */
export async function serveCanonicalOperationStatus(
  request: Request,
  expectedKind: OperationKind,
  expectedId: string,
  load: OperationStatusLoader,
) {
  if (!/^[A-Za-z0-9._:-]{4,160}$/.test(expectedId)) return errorResponse(400, "INVALID_OPERATION_ID");
  const persisted = await load(expectedKind, expectedId);
  if (!persisted) return errorResponse(404, "OPERATION_NOT_FOUND");
  if (persisted.kind !== expectedKind || persisted.id !== expectedId) return errorResponse(409, "OPERATION_IDENTITY_MISMATCH");

  const mappedStatus = persisted.status === "COMPLETED" ? "FINALIZED" : persisted.status;
  if (!isOperationStatus(mappedStatus)) return errorResponse(500, "INVALID_PERSISTED_OPERATION_STATUS");
  if (!Number.isInteger(persisted.revision) || persisted.revision < 0) return errorResponse(500, "INVALID_PERSISTED_OPERATION_REVISION");

  return operationStatusResponse(request, {
    kind: persisted.kind,
    id: persisted.id,
    status: mappedStatus,
    revision: persisted.revision,
    observedAt: persisted.observedAt,
  });
}
