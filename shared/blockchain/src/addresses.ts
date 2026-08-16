import bs58 from "bs58";
import type { BlockchainChain } from "@powerchain/clusters";

export function isSolanaAddress(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try { return bs58.decode(value.trim()).length === 32; } catch { return false; }
}
export function normalizeSolanaAddress(value: unknown): string {
  if (!isSolanaAddress(value)) throw new Error("SOLANA_ADDRESS_INVALID");
  return value.trim();
}
export function isSuiAddress(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{1,64}$/.test(value.trim());
}
export function normalizeSuiAddress(value: unknown): string {
  if (!isSuiAddress(value)) throw new Error("SUI_ADDRESS_INVALID");
  return `0x${value.trim().slice(2).toLowerCase().padStart(64, "0")}`;
}
export function isSuiCoinType(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parts = value.trim().split("::");
  return parts.length === 3 && isSuiAddress(parts[0]) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(parts[1] ?? "") && /^[A-Za-z_][A-Za-z0-9_]*$/.test(parts[2] ?? "");
}
export function normalizeSuiCoinType(value: unknown): string {
  if (!isSuiCoinType(value)) throw new Error("SUI_COIN_TYPE_INVALID");
  const [address, moduleName, structName] = value.trim().split("::");
  return `${normalizeSuiAddress(address)}::${moduleName}::${structName}`;
}
export function normalizeChainAddress(chain: BlockchainChain, value: unknown): string {
  return chain === "SOLANA" ? normalizeSolanaAddress(value) : normalizeSuiAddress(value);
}
export function isChainAddress(chain: BlockchainChain, value: unknown): value is string {
  return chain === "SOLANA" ? isSolanaAddress(value) : isSuiAddress(value);
}
