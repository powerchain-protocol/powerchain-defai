import "server-only";

export type ExplorerChain = "SOLANA" | "SUI";
export type ExplorerResource = "account" | "transaction" | "token";
export type SuiExplorerNetwork = "mainnet" | "testnet" | "devnet";

function stripTrailingSlash(value: string) { return value.replace(/\/+$/, ""); }
function encode(value: string) { return encodeURIComponent(value.trim()); }

export function explorerBaseUrls() {
  return {
    solana: stripTrailingSlash(process.env.NEXT_PUBLIC_SOLSCAN_BASE_URL?.trim() || "https://solscan.io"),
    sui: stripTrailingSlash(process.env.NEXT_PUBLIC_SUISCAN_BASE_URL?.trim() || "https://suiscan.xyz"),
  } as const;
}

export function solscanAccountUrl(address: string) { return `${explorerBaseUrls().solana}/account/${encode(address)}`; }
export function solscanTransactionUrl(signature: string) { return `${explorerBaseUrls().solana}/tx/${encode(signature)}`; }
export function solscanTokenUrl(mint: string) { return `${explorerBaseUrls().solana}/token/${encode(mint)}`; }
export function suiscanAccountUrl(address: string, network: SuiExplorerNetwork = "mainnet") { return `${explorerBaseUrls().sui}/${network}/account/${encode(address)}`; }
export function suiscanTransactionUrl(digest: string, network: SuiExplorerNetwork = "mainnet") { return `${explorerBaseUrls().sui}/${network}/tx/${encode(digest)}`; }

export function explorerUrl(input: { chain: ExplorerChain; resource: ExplorerResource; id: string; network?: SuiExplorerNetwork }) {
  if (!input.id.trim()) throw new Error("EXPLORER_ID_REQUIRED");
  if (input.chain === "SOLANA") {
    if (input.resource === "account") return solscanAccountUrl(input.id);
    if (input.resource === "token") return solscanTokenUrl(input.id);
    return solscanTransactionUrl(input.id);
  }
  if (input.resource === "token") throw new Error("SUI_TOKEN_EXPLORER_RESOURCE_UNSUPPORTED");
  return input.resource === "account" ? suiscanAccountUrl(input.id, input.network) : suiscanTransactionUrl(input.id, input.network);
}
