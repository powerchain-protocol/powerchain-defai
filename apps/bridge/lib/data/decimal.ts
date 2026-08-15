export function scaledIntegerToDecimal(value: string | bigint, exponent: number): string {
  const raw = typeof value === "bigint" ? value.toString() : value.trim();
  if (!/^-?\d+$/.test(raw)) throw new Error("invalid integer value");
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  if (exponent >= 0) return `${negative ? "-" : ""}${digits}${"0".repeat(exponent)}`;
  const places = -exponent;
  const padded = digits.padStart(places + 1, "0");
  const split = padded.length - places;
  const whole = padded.slice(0, split);
  const fraction = padded.slice(split).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function baseUnitsToDecimal(value: string | bigint, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 30) throw new Error("invalid decimals");
  return scaledIntegerToDecimal(value, -decimals);
}

export function decimalString(value: unknown): string | null {
  if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value.trim())) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}
