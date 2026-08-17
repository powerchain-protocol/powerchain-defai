export type ExplorerChain = "solana" | "sui";
export type SuiExplorerNetwork = "mainnet" | "testnet" | "devnet";

const strip = (value: string) => value.replace(/\/+$/, "");
const encode = (value: string) => encodeURIComponent(value.trim());

export function explorerBase(chain: ExplorerChain): string {
  if (chain === "solana") return strip(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io");
  return strip(process.env.NEXT_PUBLIC_SUISCAN_BASE_URL?.trim() || "https://suiscan.xyz");
}

export function transactionExplorerUrl(chain: ExplorerChain, id: string): string {
  return chain === "solana" ? solscanTransactionUrl(id) : suiscanTransactionUrl(id);
}

export function addressExplorerUrl(chain: ExplorerChain, address: string): string {
  return chain === "solana" ? solscanAccountUrl(address) : suiscanAccountUrl(address);
}

export function solscanAccountUrl(address: string): string {
  return `${explorerBase("solana")}/account/${encode(address)}`;
}

export function solscanTransactionUrl(signature: string): string {
  return `${explorerBase("solana")}/tx/${encode(signature)}`;
}

export function solscanTokenUrl(mint: string): string {
  return `${explorerBase("solana")}/token/${encode(mint)}`;
}

function suiPath(network: SuiExplorerNetwork): string {
  return network === "mainnet" ? "mainnet" : network;
}

export function suiscanAccountUrl(address: string, network: SuiExplorerNetwork = "mainnet"): string {
  return `${explorerBase("sui")}/${suiPath(network)}/account/${encode(address)}`;
}

export function suiscanTransactionUrl(digest: string, network: SuiExplorerNetwork = "mainnet"): string {
  return `${explorerBase("sui")}/${suiPath(network)}/tx/${encode(digest)}`;
}
