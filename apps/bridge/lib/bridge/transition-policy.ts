export type BridgeTransferState =
  | "CREATED"
  | "SOURCE_SUBMITTING"
  | "SOURCE_SUBMITTED"
  | "SOURCE_FINALIZED"
  | "MESSAGE_OBSERVED"
  | "DESTINATION_SUBMITTED"
  | "DESTINATION_FINALIZED"
  | "RECONCILIATION_REQUIRED"
  | "COMPLETED"
  | "FAILED";

const ALLOWED: Record<BridgeTransferState, ReadonlySet<BridgeTransferState>> = {
  CREATED: new Set(["SOURCE_SUBMITTING", "FAILED"]),
  SOURCE_SUBMITTING: new Set(["SOURCE_SUBMITTED", "FAILED"]),
  SOURCE_SUBMITTED: new Set(["SOURCE_FINALIZED", "RECONCILIATION_REQUIRED", "FAILED"]),
  SOURCE_FINALIZED: new Set(["MESSAGE_OBSERVED", "DESTINATION_SUBMITTED", "RECONCILIATION_REQUIRED", "FAILED"]),
  MESSAGE_OBSERVED: new Set(["DESTINATION_SUBMITTED", "RECONCILIATION_REQUIRED", "FAILED"]),
  DESTINATION_SUBMITTED: new Set(["DESTINATION_FINALIZED", "RECONCILIATION_REQUIRED", "FAILED"]),
  DESTINATION_FINALIZED: new Set(["RECONCILIATION_REQUIRED", "COMPLETED", "FAILED"]),
  RECONCILIATION_REQUIRED: new Set(["COMPLETED", "FAILED"]),
  COMPLETED: new Set(),
  FAILED: new Set(),
};

export function canTransitionBridgeState(from: BridgeTransferState, to: BridgeTransferState) {
  return from === to || ALLOWED[from].has(to);
}

export function assertBridgeStateTransition(from: BridgeTransferState, to: BridgeTransferState) {
  if (!canTransitionBridgeState(from, to)) throw new Error(`INVALID_BRIDGE_TRANSITION:${from}->${to}`);
}
