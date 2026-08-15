import { createHash } from "node:crypto";
import type { ServiceFeeAssessment } from "./types";

function canonical(fields: readonly string[]): string {
  return fields.map((field) => `${field.length}:${field}`).join("|");
}

export function serviceFeeCommitment(input: Omit<ServiceFeeAssessment, "commitment">): string {
  const payload = canonical([
    "POWERCHAIN_SERVICE_FEE_V1",
    input.policyId,
    String(input.policyVersion),
    input.routeId,
    input.sourceChain,
    input.assetId,
    input.principalBaseUnits,
    String(input.feeBps),
    input.feeBaseUnits,
    input.recipient,
  ]);
  return createHash("sha256").update(payload).digest("hex");
}
