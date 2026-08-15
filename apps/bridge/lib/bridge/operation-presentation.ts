import { OperationKind, OperationStatus, isOperationTerminal, requiresOperationRecovery } from "./operation-journal";

export type OperationTone = "neutral" | "progress" | "success" | "warning" | "danger";

const STATUS_LABELS: Record<OperationStatus, string> = {
  PREPARING: "Preparing",
  RESERVED: "Reserved",
  SIGNING: "Waiting for signature",
  SUBMITTED: "Submitted",
  SOURCE_FINALIZED: "Source finalized",
  DESTINATION_SUBMITTED: "Destination submitted",
  DESTINATION_FINALIZED: "Destination finalized",
  RECONCILIATION_REQUIRED: "Reconciliation required",
  FINALIZED: "Finalized",
  FAILED: "Failed",
  UNKNOWN: "Outcome unknown",
};

export function operationKindLabel(kind: OperationKind) {
  return kind === "bridge" ? "Bridge transfer" : "PWRC claim";
}

export function operationStatusLabel(status: OperationStatus) {
  return STATUS_LABELS[status];
}

export function operationStatusTone(status: OperationStatus): OperationTone {
  if (status === "FINALIZED") return "success";
  if (status === "FAILED") return "danger";
  if (requiresOperationRecovery(status)) return "warning";
  if (status === "PREPARING") return "neutral";
  return "progress";
}

export function operationStatusSummary(kind: OperationKind, status: OperationStatus) {
  if (status === "FINALIZED") return `${operationKindLabel(kind)} completed.`;
  if (status === "FAILED") return `${operationKindLabel(kind)} failed. Review the persisted status before another mutation.`;
  if (status === "UNKNOWN") return "Submission outcome is unknown. Do not resubmit until the existing status is checked.";
  if (status === "RECONCILIATION_REQUIRED") return "The operation requires reconciliation. Do not create a replacement operation.";
  return `${operationKindLabel(kind)} is ${operationStatusLabel(status).toLowerCase()}.`;
}

export function operationAllowsDismiss(status: OperationStatus) {
  return isOperationTerminal(status);
}
