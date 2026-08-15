import { prisma } from "@powerchain/database/prisma";
import { calculateServiceFeeBaseUnits } from "./math";
import { serviceFeeCommitment } from "./commitment";
import type { ServiceFeeAssessment, ServiceFeeChain, ServiceFeePolicyView } from "./types";

function decimalText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") return String(value);
  if (typeof value === "object" && value !== null && "toFixed" in value && typeof (value as { toFixed?: unknown }).toFixed === "function") {
    return (value as { toFixed: (digits?: number) => string }).toFixed(0);
  }
  return String(value);
}

type PolicyRow = {
  id: string; routeId: string; sourceChain: string; assetId: string; feeBps: number; recipient: string; enabled: boolean; version: number;
  minFeeBaseUnits: unknown; maxFeeBaseUnits: unknown; effectiveFrom: Date; policyCommitment: string | null;
};

function toPolicyView(policy: PolicyRow): ServiceFeePolicyView {
  return {
    id: policy.id,
    routeId: policy.routeId,
    sourceChain: policy.sourceChain as ServiceFeeChain,
    assetId: policy.assetId,
    feeBps: policy.feeBps,
    recipient: policy.recipient,
    enabled: policy.enabled,
    version: policy.version,
    minFeeBaseUnits: decimalText(policy.minFeeBaseUnits),
    maxFeeBaseUnits: decimalText(policy.maxFeeBaseUnits),
    effectiveFrom: policy.effectiveFrom,
    policyCommitment: policy.policyCommitment ?? null,
  };
}

export function assessServiceFeePolicy(policy: ServiceFeePolicyView, principalBaseUnits: string): ServiceFeeAssessment {
  const feeBaseUnits = calculateServiceFeeBaseUnits({
    principalBaseUnits,
    feeBps: policy.feeBps,
    minFeeBaseUnits: policy.minFeeBaseUnits,
    maxFeeBaseUnits: policy.maxFeeBaseUnits,
  });
  const assessment = {
    policyId: policy.id,
    policyVersion: policy.version,
    routeId: policy.routeId,
    sourceChain: policy.sourceChain,
    assetId: policy.assetId,
    principalBaseUnits,
    feeBps: policy.feeBps,
    feeBaseUnits,
    recipient: policy.recipient,
  };
  return { ...assessment, commitment: serviceFeeCommitment(assessment) };
}

export async function loadActiveServiceFeePolicy(input: { routeId: string; sourceChain: ServiceFeeChain; at?: Date }) {
  const at = input.at ?? new Date();
  const policy = await prisma.bridgeServiceFeePolicy.findFirst({
    where: {
      routeId: input.routeId,
      sourceChain: input.sourceChain,
      enabled: true,
      effectiveFrom: { lte: at },
      OR: [{ disabledAt: null }, { disabledAt: { gt: at } }],
    },
    orderBy: { version: "desc" },
  });
  if (!policy) throw new Error("SERVICE_FEE_POLICY_UNAVAILABLE");
  return toPolicyView(policy);
}

export async function assessActiveServiceFee(input: { routeId: string; sourceChain: ServiceFeeChain; principalBaseUnits: string; at?: Date }) {
  const policy = await loadActiveServiceFeePolicy(input);
  return assessServiceFeePolicy(policy, input.principalBaseUnits);
}

/**
 * Resolve the immutable fee policy that matches an already-issued quote.
 * A later policy change must not rewrite or invalidate the fee terms of a quote
 * that was valid when it was created.
 */
export async function matchServiceFeePolicyForQuote(input: {
  routeId: string;
  sourceChain: ServiceFeeChain;
  principalBaseUnits: string;
  quotedFeeBaseUnits: string;
  quotedRecipient: string;
  quotedAt: Date;
}) {
  const policies = await prisma.bridgeServiceFeePolicy.findMany({
    where: {
      routeId: input.routeId,
      sourceChain: input.sourceChain,
      effectiveFrom: { lte: input.quotedAt },
      OR: [{ disabledAt: null }, { disabledAt: { gt: input.quotedAt } }],
    },
    orderBy: { version: "desc" },
    take: 20,
  });
  let feeMatched = false;
  for (const row of policies) {
    const assessment = assessServiceFeePolicy(toPolicyView(row), input.principalBaseUnits);
    if (assessment.feeBaseUnits !== input.quotedFeeBaseUnits) continue;
    feeMatched = true;
    if (assessment.recipient === input.quotedRecipient) return assessment;
  }
  if (feeMatched) throw new Error("SERVICE_FEE_QUOTE_RECIPIENT_MISMATCH");
  throw new Error("SERVICE_FEE_QUOTE_POLICY_MISMATCH");
}
