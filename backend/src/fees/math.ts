export const BPS_DENOMINATOR = 10_000n;
export const DEFAULT_SERVICE_FEE_BPS = 250;
export const MAX_SERVICE_FEE_BPS = 1_000;

export function assertBaseUnits(value: string, code = "INVALID_BASE_UNITS"): bigint {
  if (!/^(0|[1-9][0-9]*)$/.test(value)) throw new Error(code);
  return BigInt(value);
}

export function assertFeeBps(value: number, maxBps = MAX_SERVICE_FEE_BPS): number {
  if (!Number.isInteger(value) || value < 0 || value > maxBps) throw new Error("SERVICE_FEE_BPS_OUT_OF_RANGE");
  return value;
}

export function calculateServiceFeeBaseUnits(input: {
  principalBaseUnits: string;
  feeBps: number;
  minFeeBaseUnits?: string | null;
  maxFeeBaseUnits?: string | null;
}): string {
  const principal = assertBaseUnits(input.principalBaseUnits, "SERVICE_FEE_PRINCIPAL_INVALID");
  const feeBps = assertFeeBps(input.feeBps);
  if (feeBps === 0 || principal === 0n) return "0";

  // Round up so sub-base-unit fractions never under-collect the configured policy.
  let fee = (principal * BigInt(feeBps) + BPS_DENOMINATOR - 1n) / BPS_DENOMINATOR;
  if (input.minFeeBaseUnits != null) {
    const min = assertBaseUnits(input.minFeeBaseUnits, "SERVICE_FEE_MIN_INVALID");
    if (fee < min) fee = min;
  }
  if (input.maxFeeBaseUnits != null) {
    const max = assertBaseUnits(input.maxFeeBaseUnits, "SERVICE_FEE_MAX_INVALID");
    if (fee > max) fee = max;
  }
  return fee.toString();
}

export function totalSourceDebitBaseUnits(principalBaseUnits: string, feeBaseUnits: string): string {
  return (assertBaseUnits(principalBaseUnits) + assertBaseUnits(feeBaseUnits)).toString();
}
