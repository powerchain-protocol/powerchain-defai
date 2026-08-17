/**
 * Compatibility facade for explorer URLs.
 *
 * Important runtime boundary: this module is consumed by raw Node/tsx workers as
 * well as Next.js server code, so it must never import Next's `server-only`
 * poison package. Browser-facing code should import the canonical helpers from
 * `@powerchain/protocol/explorers` directly.
 */
import {
  explorerBase,
  solscanAccountUrl,
  solscanTokenUrl,
  solscanTransactionUrl,
  suiscanAccountUrl,
  suiscanTransactionUrl,
  type SuiExplorerNetwork,
} from "@powerchain/protocol/explorers";

export type ExplorerChain = "SOLANA" | "SUI";
export type ExplorerResource = "account" | "transaction" | "token";
export type { SuiExplorerNetwork } from "@powerchain/protocol/explorers";
export {
  solscanAccountUrl,
  solscanTokenUrl,
  solscanTransactionUrl,
  suiscanAccountUrl,
  suiscanTransactionUrl,
};

export function explorerBaseUrls() {
  return {
    solana: explorerBase("solana"),
    sui: explorerBase("sui"),
  } as const;
}

export function explorerUrl(input: {
  chain: ExplorerChain;
  resource: ExplorerResource;
  id: string;
  network?: SuiExplorerNetwork;
}) {
  if (!input.id.trim()) throw new Error("EXPLORER_ID_REQUIRED");
  if (input.chain === "SOLANA") {
    if (input.resource === "account") return solscanAccountUrl(input.id);
    if (input.resource === "token") return solscanTokenUrl(input.id);
    return solscanTransactionUrl(input.id);
  }
  if (input.resource === "token") throw new Error("SUI_TOKEN_EXPLORER_RESOURCE_UNSUPPORTED");
  return input.resource === "account"
    ? suiscanAccountUrl(input.id, input.network)
    : suiscanTransactionUrl(input.id, input.network);
}
