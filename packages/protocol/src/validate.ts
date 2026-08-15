import { PublicKey } from "@solana/web3.js";

export function requireNonEmpty(value: string, code: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(code);
  return normalized;
}
export function validateSolanaAddress(value: string): string {
  const normalized = requireNonEmpty(value, "SOLANA_ADDRESS_REQUIRED");
  try { return new PublicKey(normalized).toBase58(); } catch { throw new Error("INVALID_SOLANA_ADDRESS"); }
}
export function validateSuiAddress(value: string): string {
  const normalized = requireNonEmpty(value, "SUI_ADDRESS_REQUIRED").toLowerCase();
  if (!/^0x[0-9a-f]{64}$/.test(normalized)) throw new Error("INVALID_SUI_ADDRESS");
  return normalized;
}
export function validateBaseUnits(value: string): bigint {
  if (!/^(0|[1-9]\d*)$/.test(value)) throw new Error("INVALID_BASE_UNITS");
  return BigInt(value);
}
