export type OperationKind = "bridge" | "claim";
export type OperationStatus =
  | "PREPARING"
  | "RESERVED"
  | "SIGNING"
  | "SUBMITTED"
  | "SOURCE_FINALIZED"
  | "DESTINATION_SUBMITTED"
  | "DESTINATION_FINALIZED"
  | "RECONCILIATION_REQUIRED"
  | "FINALIZED"
  | "FAILED"
  | "UNKNOWN";

/**
 * Canonical recovery record. Do not add schema/journal versions here.
 * New optional fields must remain backward-compatible and be normalized on read.
 */
export type OperationRecord = {
  kind: OperationKind;
  id: string;
  status: OperationStatus;
  createdAt: string;
  updatedAt: string;
  walletIdentity?: string;
  statusHref: string;
  statusApiHref?: string;
  revision: number;
  serverRevision?: number;
  serverObservedAt?: string;
  serverSnapshotId?: string;
  terminalAt?: string;
};

export type ServerOperationObservation = {
  id?: string;
  kind?: OperationKind;
  status: OperationStatus;
  observedAt?: string;
  revision?: number;
  snapshotId?: string;
};

export type OperationJournalMessage =
  | { type: "record"; record: OperationRecord }
  | { type: "clear"; id?: string; revision?: number };

/** Stable canonical persistence + BroadcastChannel identity. */
export const OPERATION_JOURNAL_KEY = "powerchain.operation-journal";
export const OPERATION_JOURNAL_CHANNEL = "powerchain.operation-journal";

/**
 * Import-only aliases from pre-canonical builds. Never write to these keys and
 * never create another suffixed key. They are deleted after normalization.
 */
export const LEGACY_OPERATION_JOURNAL_KEYS = [
  "powerchain.operation-journal.v4",
  "powerchain.operation-journal.v3",
  "powerchain.operation-journal.v2",
  "powerchain.operation-journal.v1",
] as const;

export const OPERATION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const OPERATION_TERMINAL_RETENTION_MS = 2 * 60 * 60 * 1000;
const FUTURE_SKEW_MS = 60_000;

const BRIDGE_ORDER: OperationStatus[] = [
  "PREPARING",
  "SIGNING",
  "SUBMITTED",
  "SOURCE_FINALIZED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "FINALIZED",
];
const CLAIM_ORDER: OperationStatus[] = ["PREPARING", "RESERVED", "SIGNING", "SUBMITTED", "FINALIZED"];

function safeId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 4 && value.length <= 160 && /^[A-Za-z0-9._:-]+$/.test(value);
}
function safeSnapshotId(value: unknown): value is string {
  return typeof value === "string" && value.length >= 8 && value.length <= 160 && /^[A-Za-z0-9._:-]+$/.test(value);
}
function safeHref(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && value.length <= 512;
}
function parseTimestamp(value: unknown, now: number, maxAge = OPERATION_MAX_AGE_MS) {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || now - parsed > maxAge || parsed - now > FUTURE_SKEW_MS) return null;
  return value;
}
function safeRevision(value: unknown) {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 1_000_000_000 ? Number(value) : undefined;
}

export function isOperationStatus(value: unknown): value is OperationStatus {
  return (
    typeof value === "string" &&
    [
      "PREPARING",
      "RESERVED",
      "SIGNING",
      "SUBMITTED",
      "SOURCE_FINALIZED",
      "DESTINATION_SUBMITTED",
      "DESTINATION_FINALIZED",
      "RECONCILIATION_REQUIRED",
      "FINALIZED",
      "FAILED",
      "UNKNOWN",
    ].includes(value)
  );
}
export function isOperationTerminal(status: OperationStatus) {
  return status === "FINALIZED" || status === "FAILED";
}
export function requiresOperationRecovery(status: OperationStatus) {
  return status === "UNKNOWN" || status === "RECONCILIATION_REQUIRED";
}

export function operationTerminalExpiresAt(record: OperationRecord) {
  if (!isOperationTerminal(record.status)) return null;
  const base = Date.parse(record.terminalAt ?? record.updatedAt);
  return Number.isFinite(base) ? base + OPERATION_TERMINAL_RETENTION_MS : null;
}

export function shouldPruneOperationRecord(record: OperationRecord, now = Date.now()) {
  const created = Date.parse(record.createdAt);
  if (!Number.isFinite(created) || now - created > OPERATION_MAX_AGE_MS) return true;
  const terminalExpiry = operationTerminalExpiresAt(record);
  return terminalExpiry !== null && now >= terminalExpiry;
}

export function isSafeOperationStatusHref(kind: OperationKind, id: string, value: unknown) {
  if (!safeHref(value) || typeof value !== "string") return false;
  try {
    const url = new URL(value, "https://powerchain.invalid");
    if (url.origin !== "https://powerchain.invalid" || url.hash || url.username || url.password) return false;
    const decoded = decodeURIComponent(url.pathname);
    if (decoded.includes("..")) return false;
    const encodedId = encodeURIComponent(id);
    if (!url.pathname.includes(encodedId) && !url.pathname.includes(id)) return false;
    if (kind === "bridge") return /\/(bridge\/)?(transfers?|status)\//.test(url.pathname);
    return /\/(claims?|status)\//.test(url.pathname);
  } catch {
    return false;
  }
}

/**
 * Normalize canonical and historical records into the one canonical shape.
 * Historical `version` fields are deliberately ignored and never persisted.
 */
export function parseOperationRecord(value: unknown, now = Date.now()): OperationRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (record.kind !== "bridge" && record.kind !== "claim") return null;
  if (!safeId(record.id) || !isOperationStatus(record.status) || !isSafeOperationStatusHref(record.kind, record.id, record.statusHref)) return null;
  if (record.statusApiHref !== undefined && !isSafeOperationStatusHref(record.kind, record.id, record.statusApiHref)) return null;

  const createdAt = parseTimestamp(record.createdAt, now);
  const updatedAt = parseTimestamp(record.updatedAt, now);
  if (!createdAt || !updatedAt) return null;
  if (record.walletIdentity !== undefined && (typeof record.walletIdentity !== "string" || record.walletIdentity.length > 256)) return null;

  const revision = safeRevision(record.revision) ?? 1;
  if (revision < 1) return null;
  const serverRevision = record.serverRevision === undefined ? undefined : safeRevision(record.serverRevision);
  if (record.serverRevision !== undefined && serverRevision === undefined) return null;
  const serverObservedAt = record.serverObservedAt === undefined ? undefined : parseTimestamp(record.serverObservedAt, now);
  if (record.serverObservedAt !== undefined && !serverObservedAt) return null;
  if (record.serverSnapshotId !== undefined && !safeSnapshotId(record.serverSnapshotId)) return null;

  let terminalAt = record.terminalAt === undefined ? undefined : parseTimestamp(record.terminalAt, now, OPERATION_TERMINAL_RETENTION_MS);
  if (record.terminalAt !== undefined && !terminalAt) return null;
  if (isOperationTerminal(record.status) && !terminalAt) terminalAt = updatedAt;
  if (isOperationTerminal(record.status) && terminalAt && now - Date.parse(terminalAt) > OPERATION_TERMINAL_RETENTION_MS) return null;

  return {
    kind: record.kind,
    id: record.id,
    status: record.status,
    createdAt,
    updatedAt,
    statusHref: record.statusHref as string,
    revision,
    ...(typeof record.walletIdentity === "string" ? { walletIdentity: record.walletIdentity } : {}),
    ...(typeof record.statusApiHref === "string" ? { statusApiHref: record.statusApiHref } : {}),
    ...(serverRevision === undefined ? {} : { serverRevision }),
    ...(serverObservedAt === undefined ? {} : { serverObservedAt }),
    ...(typeof record.serverSnapshotId === "string" ? { serverSnapshotId: record.serverSnapshotId } : {}),
    ...(terminalAt === undefined ? {} : { terminalAt }),
  };
}

function statusIndex(kind: OperationKind, status: OperationStatus) {
  return (kind === "bridge" ? BRIDGE_ORDER : CLAIM_ORDER).indexOf(status);
}
export function mayAdvanceOperation(kind: OperationKind, current: OperationStatus, next: OperationStatus) {
  if (current === next) return true;
  if (isOperationTerminal(current)) return false;
  if (next === "FAILED" || next === "RECONCILIATION_REQUIRED" || next === "UNKNOWN") return true;
  if (current === "UNKNOWN" || current === "RECONCILIATION_REQUIRED") return next !== "PREPARING";
  const a = statusIndex(kind, current);
  const b = statusIndex(kind, next);
  return a >= 0 && b >= 0 && b > a;
}

export function advanceLocalOperation(record: OperationRecord, status: OperationStatus, now = new Date().toISOString()): OperationRecord {
  if (!mayAdvanceOperation(record.kind, record.status, status)) throw new Error(`OPERATION_STATUS_REGRESSION:${record.status}->${status}`);
  if (record.status === status) return record;
  const base = { ...record, status, updatedAt: now, revision: record.revision + 1 };
  if (isOperationTerminal(status)) return { ...base, terminalAt: now };
  const { terminalAt: _terminalAt, ...withoutTerminal } = base;
  return withoutTerminal;
}

export function applyServerOperationObservation(record: OperationRecord, observation: ServerOperationObservation): OperationRecord {
  if (observation.id && observation.id !== record.id) throw new Error("OPERATION_ID_MISMATCH");
  if (observation.kind && observation.kind !== record.kind) throw new Error("OPERATION_KIND_MISMATCH");
  if (observation.revision !== undefined) {
    if (!Number.isInteger(observation.revision) || observation.revision < 0) throw new Error("INVALID_SERVER_REVISION");
    if (record.serverRevision !== undefined && observation.revision < record.serverRevision) return record;
    if (record.serverRevision !== undefined && observation.revision === record.serverRevision && observation.status !== record.status) {
      throw new Error("OPERATION_SERVER_REVISION_CONFLICT");
    }
  }
  if (!mayAdvanceOperation(record.kind, record.status, observation.status)) return record;
  const observed = observation.observedAt ? Date.parse(observation.observedAt) : Date.now();
  const updated = Number.isFinite(observed) ? new Date(Math.min(observed, Date.now() + FUTURE_SKEW_MS)).toISOString() : new Date().toISOString();
  const serverRevision = observation.revision ?? record.serverRevision;
  const serverSnapshotId = observation.snapshotId ?? record.serverSnapshotId;
  const next = {
    ...record,
    status: observation.status,
    updatedAt: updated,
    revision: record.revision + 1,
    serverObservedAt: updated,
    ...(serverRevision === undefined ? {} : { serverRevision }),
    ...(serverSnapshotId === undefined ? {} : { serverSnapshotId }),
  };
  if (isOperationTerminal(observation.status)) return { ...next, terminalAt: updated };
  const { terminalAt: _terminalAt, ...withoutTerminal } = next;
  return withoutTerminal;
}

export function normalizeServerOperationObservation(value: unknown): ServerOperationObservation | null {
  if (!value || typeof value !== "object") return null;
  const root = value as Record<string, unknown>;
  const candidates = [root, root.transfer, root.claim, root.operation].filter(
    (item): item is Record<string, unknown> => !!item && typeof item === "object",
  );
  for (const item of candidates) {
    const mapped = item.status === "COMPLETED" ? "FINALIZED" : item.status;
    if (!isOperationStatus(mapped)) continue;
    const id =
      typeof item.id === "string"
        ? item.id
        : typeof item.transferId === "string"
          ? item.transferId
          : typeof item.claimId === "string"
            ? item.claimId
            : undefined;
    const kind = item.kind === "bridge" || item.kind === "claim" ? item.kind : undefined;
    const observedAt = typeof item.updatedAt === "string" ? item.updatedAt : typeof item.observedAt === "string" ? item.observedAt : undefined;
    const revision = safeRevision(item.revision ?? item.sequence ?? root.revision ?? root.sequence);
    const snapshotId = typeof item.snapshotId === "string" ? item.snapshotId : typeof root.snapshotId === "string" ? root.snapshotId : undefined;
    if (snapshotId !== undefined && !safeSnapshotId(snapshotId)) return null;
    return {
      status: mapped,
      ...(id === undefined ? {} : { id }),
      ...(kind === undefined ? {} : { kind }),
      ...(observedAt === undefined ? {} : { observedAt }),
      ...(revision === undefined ? {} : { revision }),
      ...(snapshotId === undefined ? {} : { snapshotId }),
    };
  }
  return null;
}
