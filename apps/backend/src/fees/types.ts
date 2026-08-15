export type ServiceFeeChain = "SOLANA" | "SUI";
export type ServiceFeeSettlementStatus =
  | "ASSESSED"
  | "SUBMITTED"
  | "VERIFIED"
  | "FAILED"
  | "RETRY_WAIT"
  | "MANUAL_REVIEW"
  | "WAIVED";

export interface ServiceFeePolicyView {
  id: string;
  routeId: string;
  sourceChain: ServiceFeeChain;
  assetId: string;
  feeBps: number;
  recipient: string;
  enabled: boolean;
  version: number;
  minFeeBaseUnits: string | null;
  maxFeeBaseUnits: string | null;
  effectiveFrom: Date;
  policyCommitment?: string | null;
}

export interface ServiceFeeAssessment {
  policyId: string;
  policyVersion: number;
  routeId: string;
  sourceChain: ServiceFeeChain;
  assetId: string;
  principalBaseUnits: string;
  feeBps: number;
  feeBaseUnits: string;
  recipient: string;
  commitment: string;
}

export interface ServiceFeeVerificationResult {
  verified: boolean;
  finalized: boolean;
  sourceTx: string;
  expectedBaseUnits: string;
  recipient: string;
  evidence: Record<string, unknown>;
  errorCode?: string;
}
