export const BPS_DENOMINATOR = 10_000n;
export function calculateServiceFeeBaseUnits(principal: bigint, feeBps: number): bigint {
  if (principal < 0n) throw new Error("INVALID_PRINCIPAL");
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) throw new Error("INVALID_FEE_BPS");
  return (principal * BigInt(feeBps)) / BPS_DENOMINATOR;
}
export function totalSourceDebit(principal: bigint, serviceFee: bigint): bigint {
  if (principal < 0n || serviceFee < 0n) throw new Error("INVALID_AMOUNT");
  return principal + serviceFee;
}
