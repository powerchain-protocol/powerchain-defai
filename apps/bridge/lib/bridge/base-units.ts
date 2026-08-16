export const PWRC_DECIMALS = 9;

export class AmountValidationError extends Error {
  readonly code = "INVALID_AMOUNT";
  constructor(message: string) {
    super(message);
    this.name = "AmountValidationError";
  }
}

export function decimalToBaseUnits(value: string, decimals = PWRC_DECIMALS): bigint {
  const input = value.trim();
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new AmountValidationError("Unsupported decimals");
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(input)) throw new AmountValidationError("Amount must be a positive decimal string");
  const [whole = "0", fraction = ""] = input.split(".");
  if (fraction.length > decimals) throw new AmountValidationError(`Amount supports at most ${decimals} decimal places`);
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals) || "0");
  if (units <= 0n) throw new AmountValidationError("Amount must be greater than zero");
  return units;
}

export function baseUnitsToDecimalString(value: bigint, decimals = PWRC_DECIMALS): string {
  if (value < 0n) throw new AmountValidationError("Negative asset amounts are not supported");
  const scale = 10n ** BigInt(decimals);
  const whole = value / scale;
  const fraction = (value % scale).toString().padStart(decimals, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function parsePositiveBaseUnits(value: unknown, field = "amountBaseUnits"): bigint {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) throw new AmountValidationError(`${field} must be a positive base-unit string`);
  return BigInt(value);
}

export function parseNonNegativeBaseUnits(value: unknown, field = "amountBaseUnits"): bigint {
  if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AmountValidationError(`${field} must be a non-negative base-unit string`);
  return BigInt(value);
}
