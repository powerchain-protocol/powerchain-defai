import { BPS_DENOMINATOR, assertBaseUnits, assertFeeBps, calculateServiceFeeBaseUnits } from "../fees/math";

export type CalculatorResult = {
  principalBaseUnits: string;
  feeBaseUnits: string;
  totalDebitBaseUnits: string;
  minimumReceivedBaseUnits: string;
  feeBps: number;
  slippageBps: number;
};

export function assertSlippageBps(value: number, maxBps = 500): number {
  if (!Number.isInteger(value) || value < 1 || value > maxBps) throw new Error("SLIPPAGE_BPS_OUT_OF_RANGE");
  return value;
}

export function calculateMinimumReceivedBaseUnits(outputBaseUnits: string, slippageBps: number): string {
  const output = assertBaseUnits(outputBaseUnits, "OUTPUT_BASE_UNITS_INVALID");
  const bps = assertSlippageBps(slippageBps);
  return ((output * (BPS_DENOMINATOR - BigInt(bps))) / BPS_DENOMINATOR).toString();
}

export function calculateBpsAmountBaseUnits(input: { amountBaseUnits: string; bps: number; roundUp?: boolean }): string {
  const amount = assertBaseUnits(input.amountBaseUnits, "AMOUNT_BASE_UNITS_INVALID");
  const bps = assertFeeBps(input.bps, 10_000);
  const numerator = amount * BigInt(bps);
  return (input.roundUp === false ? numerator / BPS_DENOMINATOR : (numerator + BPS_DENOMINATOR - 1n) / BPS_DENOMINATOR).toString();
}

export function calculateTransactionAmounts(input: {
  principalBaseUnits: string;
  quotedOutputBaseUnits: string;
  feeBps: number;
  slippageBps: number;
  minFeeBaseUnits?: string | null;
  maxFeeBaseUnits?: string | null;
}): CalculatorResult {
  const principal = assertBaseUnits(input.principalBaseUnits, "PRINCIPAL_BASE_UNITS_INVALID");
  const feeBps = assertFeeBps(input.feeBps);
  const slippageBps = assertSlippageBps(input.slippageBps);
  const feeBaseUnits = calculateServiceFeeBaseUnits({
    principalBaseUnits: principal.toString(),
    feeBps,
    minFeeBaseUnits: input.minFeeBaseUnits,
    maxFeeBaseUnits: input.maxFeeBaseUnits,
  });
  const totalDebitBaseUnits = (principal + BigInt(feeBaseUnits)).toString();
  const minimumReceivedBaseUnits = calculateMinimumReceivedBaseUnits(input.quotedOutputBaseUnits, slippageBps);
  return { principalBaseUnits: principal.toString(), feeBaseUnits, totalDebitBaseUnits, minimumReceivedBaseUnits, feeBps, slippageBps };
}
