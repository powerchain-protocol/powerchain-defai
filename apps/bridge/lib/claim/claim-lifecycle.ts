export type ClaimLifecycleState =
  | "IDLE"
  | "CHECKING_ELIGIBILITY"
  | "ELIGIBLE"
  | "NOT_ELIGIBLE"
  | "ALREADY_CLAIMED"
  | "RESERVING"
  | "RESERVED"
  | "SIGNING"
  | "SUBMITTING"
  | "SUBMITTED"
  | "FINALIZED"
  | "EXPIRED"
  | "FAILED"
  | "UNKNOWN";

const ALLOWED: Record<ClaimLifecycleState, readonly ClaimLifecycleState[]> = {
  IDLE: ["CHECKING_ELIGIBILITY"],
  CHECKING_ELIGIBILITY: ["ELIGIBLE", "NOT_ELIGIBLE", "ALREADY_CLAIMED", "FAILED"],
  ELIGIBLE: ["RESERVING", "CHECKING_ELIGIBILITY"],
  NOT_ELIGIBLE: ["CHECKING_ELIGIBILITY"],
  ALREADY_CLAIMED: ["CHECKING_ELIGIBILITY"],
  RESERVING: ["RESERVED", "FAILED", "UNKNOWN"],
  RESERVED: ["SIGNING", "EXPIRED", "CHECKING_ELIGIBILITY"],
  SIGNING: ["SUBMITTING", "RESERVED", "EXPIRED", "FAILED"],
  SUBMITTING: ["SUBMITTED", "UNKNOWN", "FAILED"],
  SUBMITTED: ["FINALIZED", "FAILED", "UNKNOWN"],
  FINALIZED: [],
  EXPIRED: ["CHECKING_ELIGIBILITY"],
  FAILED: ["CHECKING_ELIGIBILITY"],
  UNKNOWN: ["SUBMITTED", "FINALIZED", "FAILED"],
};

export function canTransitionClaim(from: ClaimLifecycleState, to: ClaimLifecycleState): boolean {
  return ALLOWED[from].includes(to);
}

export function assertClaimTransition(from: ClaimLifecycleState, to: ClaimLifecycleState): void {
  if (!canTransitionClaim(from, to)) {
    throw new Error(`INVALID_CLAIM_TRANSITION:${from}->${to}`);
  }
}

export function claimStateNeedsStatusRecovery(state: ClaimLifecycleState): boolean {
  return state === "UNKNOWN" || state === "SUBMITTED";
}

export function claimStateBlocksNewMutation(state: ClaimLifecycleState): boolean {
  return ["RESERVING", "RESERVED", "SIGNING", "SUBMITTING", "SUBMITTED", "UNKNOWN"].includes(state);
}
