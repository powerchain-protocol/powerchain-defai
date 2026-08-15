export type ExplorerChain = "solana" | "sui";
const strip = (v: string) => v.replace(/\/+$/, "");
export function explorerBase(chain: ExplorerChain): string {
  if (chain === "solana") return strip(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io");
  return strip(process.env.NEXT_PUBLIC_SUISCAN_BASE_URL?.trim() || "https://suiscan.xyz");
}
export function transactionExplorerUrl(chain: ExplorerChain, id: string): string {
  const encoded = encodeURIComponent(id);
  return chain === "solana" ? `${explorerBase(chain)}/tx/${encoded}` : `${explorerBase(chain)}/tx/${encoded}`;
}
export function addressExplorerUrl(chain: ExplorerChain, address: string): string {
  const encoded = encodeURIComponent(address);
  return chain === "solana" ? `${explorerBase(chain)}/account/${encoded}` : `${explorerBase(chain)}/address/${encoded}`;
}
