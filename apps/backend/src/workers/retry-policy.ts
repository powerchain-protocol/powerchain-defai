export type WorkerRetryDisposition = "retry" | "manual-review";

function codeOf(errorCode: string): string {
  return errorCode.trim().toUpperCase().slice(0, 160);
}

const BRIDGE_MANUAL_REVIEW_CODES = new Set([
  "TRANSFER_NOT_FOUND",
  "SOURCE_TX_REQUIRED",
  "DESTINATION_TX_REQUIRED",
  "FINALITY_EVIDENCE_INCOMPLETE",
  "WORMHOLE_RECONCILIATION_MISMATCH",
]);

export function bridgeRetryDisposition(errorCode: string): WorkerRetryDisposition {
  const code = codeOf(errorCode);
  if (BRIDGE_MANUAL_REVIEW_CODES.has(code)) return "manual-review";
  if (code.includes("MISMATCH") || code.includes("INVALID") || code.includes("UNSUPPORTED")) return "manual-review";
  return "retry";
}

export function bridgeMaxAttempts(env: NodeJS.ProcessEnv = process.env): number {
  const parsed = Number(env.POWERCHAIN_BRIDGE_MAX_ATTEMPTS ?? 25);
  return Number.isInteger(parsed) ? Math.max(3, Math.min(100, parsed)) : 25;
}
