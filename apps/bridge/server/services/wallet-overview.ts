import "server-only";

import { getSolanaWalletOverview, getSuiWalletOverview } from "./wallet-data";
import { mergeWalletActivity } from "./wallet-activity";

export async function getCrossChainWalletOverview(input: {
  solanaAddress?: string | null;
  suiAddress?: string | null;
  solanaBefore?: string | null;
  solanaPaginationToken?: string | null;
  suiCursor?: string | null;
  limit?: number;
}) {
  const limit = Math.max(1, Math.min(input.limit ?? 25, 50));
  const solanaPromise = input.solanaAddress
    ? getSolanaWalletOverview(input.solanaAddress, {
        before: input.solanaBefore,
        paginationToken: input.solanaPaginationToken,
        limit,
      })
    : Promise.resolve(null);
  const suiPromise = input.suiAddress
    ? getSuiWalletOverview(input.suiAddress, { cursor: input.suiCursor, limit })
    : Promise.resolve(null);

  const [solanaResult, suiResult] = await Promise.allSettled([solanaPromise, suiPromise]);
  const solana = solanaResult.status === "fulfilled" ? solanaResult.value : null;
  const sui = suiResult.status === "fulfilled" ? suiResult.value : null;
  const errors = {
    solana: solanaResult.status === "rejected" ? String(solanaResult.reason instanceof Error ? solanaResult.reason.message : solanaResult.reason) : null,
    sui: suiResult.status === "rejected" ? String(suiResult.reason instanceof Error ? suiResult.reason.message : suiResult.reason) : null,
  };

  const activity = mergeWalletActivity(
    Array.isArray(solana?.history?.transactions) ? solana.history.transactions : [],
    solana?.history?.source || "unavailable",
    Array.isArray(sui?.history?.transactions) ? sui.history.transactions : [],
    sui?.history?.source || "unavailable",
    Math.min(100, limit * 2),
  );

  const availableChains = Number(Boolean(solana)) + Number(Boolean(sui));
  return {
    status: availableChains === 2 ? "ready" : availableChains === 1 ? "degraded" : "unavailable",
    solana,
    sui,
    errors,
    activity,
    checkedAt: new Date().toISOString(),
    authoritativeForBridgeAccounting: false as const,
  };
}
