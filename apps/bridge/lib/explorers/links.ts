export type SuiExplorerNetwork = "mainnet" | "testnet" | "devnet";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function solscanAccountUrl(address: string) {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io");
  return `${base}/account/${encodeURIComponent(address)}`;
}

export function solscanTransactionUrl(signature: string) {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io");
  return `${base}/tx/${encodeURIComponent(signature)}`;
}

export function solscanTokenUrl(mint: string) {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io");
  return `${base}/token/${encodeURIComponent(mint)}`;
}

export function suiscanAccountUrl(address: string, network: SuiExplorerNetwork = "mainnet") {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_SUISCAN_BASE_URL?.trim() || "https://suiscan.xyz");
  return `${base}/${network}/account/${encodeURIComponent(address)}`;
}

export function suiscanTransactionUrl(digest: string, network: SuiExplorerNetwork = "mainnet") {
  const base = stripTrailingSlash(process.env.NEXT_PUBLIC_SUISCAN_BASE_URL?.trim() || "https://suiscan.xyz");
  return `${base}/${network}/tx/${encodeURIComponent(digest)}`;
}
