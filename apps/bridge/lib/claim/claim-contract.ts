export type ClaimEligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE" | "ALREADY_CLAIMED" | "RESERVED" | "SUBMITTED" | "FINALIZED" | "UNAVAILABLE";
export type ClaimExecutionStatus = "RESERVED" | "SUBMITTING" | "SUBMITTED" | "FINALIZED" | "MANUAL_REVIEW" | "FAILED" | "EXPIRED" | "UNKNOWN";

export type ClaimEligibility = {
  wallet: string;
  status: ClaimEligibilityStatus;
  claimableBaseUnits: string;
  asset: "PWRC";
  decimals: 9;
  challengeRequired: boolean;
  reservationId?: string | null;
  claimId?: string | null;
  expiresAt?: string | null;
  reason?: string | null;
};

export function isClaimEligibility(value: unknown): value is ClaimEligibility {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row.wallet === "string" && typeof row.status === "string" && typeof row.claimableBaseUnits === "string" && /^\d+$/.test(row.claimableBaseUnits) && row.asset === "PWRC" && row.decimals === 9 && typeof row.challengeRequired === "boolean";
}

export function canStartClaim(value: ClaimEligibility) {
  return value.status === "ELIGIBLE" && BigInt(value.claimableBaseUnits) > 0n;
}

export function terminalClaimStatus(status: ClaimExecutionStatus) {
  return status === "FINALIZED" || status === "MANUAL_REVIEW" || status === "FAILED" || status === "EXPIRED";
}

export function claimStatusNeedsAttention(status: ClaimExecutionStatus) {
  return status === "MANUAL_REVIEW" || status === "FAILED" || status === "EXPIRED" || status === "UNKNOWN";
}

