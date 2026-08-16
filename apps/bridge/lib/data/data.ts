export const BRIDGE_TRANSFER_STATUSES = [
  "CREATED",
  "SOURCE_SUBMITTING",
  "SOURCE_SUBMITTED",
  "SOURCE_FINALIZED",
  "MESSAGE_OBSERVED",
  "DESTINATION_SUBMITTED",
  "DESTINATION_FINALIZED",
  "RECONCILIATION_REQUIRED",
  "COMPLETED",
  "FAILED",
] as const;

export type BridgeTransferStatus = (typeof BRIDGE_TRANSFER_STATUSES)[number];
export type BridgeDirection = "SUI_TO_SOLANA" | "SOLANA_TO_SUI";

export const BRIDGE_DIRECTIONS = {
  SUI_TO_SOLANA: {
    label: "Sui wPWRC → Solana PWRC",
    shortLabel: "wPWRC → PWRC",
    sourceChain: "Sui",
    destinationChain: "Solana",
    sourceAsset: "wPWRC",
    destinationAsset: "PWRC",
    sourceIcon: "/tokens/wpwrc.png",
    destinationIcon: "/tokens/pwrc.png",
  },
  SOLANA_TO_SUI: {
    label: "Solana PWRC → Sui wPWRC",
    shortLabel: "PWRC → wPWRC",
    sourceChain: "Solana",
    destinationChain: "Sui",
    sourceAsset: "PWRC",
    destinationAsset: "wPWRC",
    sourceIcon: "/tokens/pwrc.png",
    destinationIcon: "/tokens/wpwrc.png",
  },
} as const satisfies Record<BridgeDirection, {
  label: string;
  shortLabel: string;
  sourceChain: "Sui" | "Solana";
  destinationChain: "Sui" | "Solana";
  sourceAsset: "PWRC" | "wPWRC";
  destinationAsset: "PWRC" | "wPWRC";
  sourceIcon: string;
  destinationIcon: string;
}>;

const TERMINAL_STATUSES = new Set<BridgeTransferStatus>(["COMPLETED", "FAILED"]);
const ACTIVE_STATUSES = new Set<BridgeTransferStatus>(BRIDGE_TRANSFER_STATUSES.filter((status) => !TERMINAL_STATUSES.has(status)));

export function parseBridgeTransferStatus(value: unknown): BridgeTransferStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return BRIDGE_TRANSFER_STATUSES.find((status) => status === normalized) ?? null;
}

export function parseBridgeDirection(value: unknown): BridgeDirection | null {
  return value === "SUI_TO_SOLANA" || value === "SOLANA_TO_SUI" ? value : null;
}

export function isTerminalBridgeStatus(status: BridgeTransferStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isActiveBridgeStatus(status: BridgeTransferStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

export function bridgeStatusLabel(status: BridgeTransferStatus): string {
  return status.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, (value) => value.toUpperCase());
}

export type BridgeDurationMetrics = {
  sampleSize: number;
  averageMs: number | null;
  medianMs: number | null;
};

export type BridgeMetricsPayload = {
  generatedAt: string;
  windowHours: number;
  authoritativeForBridgeAccounting: false;
  source: "persisted-bridge-database";
  transfers: {
    total: number;
    active: number;
    completed: number;
    failed: number;
    reconciliationRequired: number;
    createdInWindow: number;
    completedInWindow: number;
    suiToSolanaInWindow: number;
    solanaToSuiInWindow: number;
    terminalCompletionRateBps: number | null;
  };
  principal: {
    suiToSolanaBaseUnits: string;
    solanaToSuiBaseUnits: string;
    completedBaseUnits: string;
    completedInWindowBaseUnits: string;
  };
  timing: {
    completedSampleSize: number;
    averageOperationDurationMs: number | null;
    medianOperationDurationMs: number | null;
    sourceFinality: BridgeDurationMetrics;
    messageObservation: BridgeDurationMetrics;
    destinationFinality: BridgeDurationMetrics;
  };
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isNullableNonNegativeNumber(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

export function isBridgeMetricsPayload(value: unknown): value is BridgeMetricsPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = value as Record<string, unknown>;
  if (root.source !== "persisted-bridge-database" || root.authoritativeForBridgeAccounting !== false) return false;
  if (typeof root.generatedAt !== "string" || !Number.isFinite(Date.parse(root.generatedAt)) || !isNonNegativeInteger(root.windowHours) || root.windowHours < 1 || root.windowHours > 720) return false;
  if (!root.transfers || typeof root.transfers !== "object" || Array.isArray(root.transfers)) return false;
  if (!root.principal || typeof root.principal !== "object" || Array.isArray(root.principal)) return false;
  if (!root.timing || typeof root.timing !== "object" || Array.isArray(root.timing)) return false;
  const transfers = root.transfers as Record<string, unknown>;
  const counts = ["total", "active", "completed", "failed", "reconciliationRequired", "createdInWindow", "completedInWindow", "suiToSolanaInWindow", "solanaToSuiInWindow"] as const;
  if (!counts.every((key) => isNonNegativeInteger(transfers[key]))) return false;
  if (!(transfers.terminalCompletionRateBps === null || (isNonNegativeInteger(transfers.terminalCompletionRateBps) && transfers.terminalCompletionRateBps <= 10_000))) return false;
  const principal = root.principal as Record<string, unknown>;
  if (!["suiToSolanaBaseUnits", "solanaToSuiBaseUnits", "completedBaseUnits", "completedInWindowBaseUnits"].every((key) => typeof principal[key] === "string" && /^\d+$/.test(principal[key] as string))) return false;
  const timing = root.timing as Record<string, unknown>;
  const isDurationMetrics = (candidate: unknown): candidate is BridgeDurationMetrics => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return false;
    const duration = candidate as Record<string, unknown>;
    return isNonNegativeInteger(duration.sampleSize)
      && isNullableNonNegativeNumber(duration.averageMs)
      && isNullableNonNegativeNumber(duration.medianMs);
  };
  return isNonNegativeInteger(timing.completedSampleSize)
    && isNullableNonNegativeNumber(timing.averageOperationDurationMs)
    && isNullableNonNegativeNumber(timing.medianOperationDurationMs)
    && isDurationMetrics(timing.sourceFinality)
    && isDurationMetrics(timing.messageObservation)
    && isDurationMetrics(timing.destinationFinality);
}
