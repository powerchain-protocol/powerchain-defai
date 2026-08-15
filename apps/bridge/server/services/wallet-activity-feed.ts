import "server-only";

import { decodeWalletActivityCursor, encodeWalletActivityCursor, type WalletActivityCursor } from "../../lib/wallet/cursor";
import { getCrossChainWalletOverview } from "./wallet-overview";

function nextPart(pagination: { nextCursor?: unknown; cursorType?: unknown } | null | undefined) {
  const value = typeof pagination?.nextCursor === "string" ? pagination.nextCursor : null;
  const kind = pagination?.cursorType;
  if (!value) return null;
  if (kind === "helius-pagination-token" || kind === "signature" || kind === "graphql-cursor" || kind === "sui-rpc-cursor") {
    return { kind, value } as const;
  }
  return null;
}

export async function getWalletActivityFeed(input: {
  solanaAddress?: string | null;
  suiAddress?: string | null;
  cursor?: string | null;
  limit?: number;
}) {
  const decoded = decodeWalletActivityCursor(input.cursor);
  const solana = decoded?.solana;
  const sui = decoded?.sui;
  const overview = await getCrossChainWalletOverview({
    ...(input.solanaAddress !== undefined ? { solanaAddress: input.solanaAddress } : {}),
    ...(input.suiAddress !== undefined ? { suiAddress: input.suiAddress } : {}),
    solanaPaginationToken: solana?.kind === "helius-pagination-token" ? solana.value : null,
    solanaBefore: solana?.kind === "signature" ? solana.value : null,
    suiCursor: sui?.value ?? null,
    ...(input.limit !== undefined ? { limit: input.limit } : {}),
  });
  const next: WalletActivityCursor = {
    v: 1,
    solana: nextPart(overview.solana?.history?.pagination),
    sui: nextPart(overview.sui?.history?.pagination),
  };
  const cursor = encodeWalletActivityCursor(next);
  return {
    ...overview,
    pagination: {
      nextCursor: cursor,
      hasNextPage: Boolean(cursor),
      cursorVersion: 1,
      opaque: true,
    },
  };
}
