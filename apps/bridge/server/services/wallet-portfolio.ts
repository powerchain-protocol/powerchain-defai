import "server-only";

import { getSolanaWalletOverview, getSuiWalletOverview } from "./wallet-data";

function integer(value: unknown) {
  return typeof value === "string" && /^\d+$/.test(value) ? BigInt(value) : 0n;
}

function maxAgeMs() {
  const raw = Number(process.env.POWERCHAIN_WALLET_ACTIVITY_MAX_AGE_MS || 120_000);
  return Number.isFinite(raw) ? Math.max(30_000, Math.min(raw, 600_000)) : 120_000;
}

function checkedAge(value: unknown, now: number) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? Math.max(0, now - timestamp) : null;
}

export async function getWalletPortfolio(input: { solanaAddress?: string | null; suiAddress?: string | null }) {
  const [solanaResult, suiResult] = await Promise.allSettled([
    input.solanaAddress ? getSolanaWalletOverview(input.solanaAddress, { limit: 1 }) : Promise.resolve(null),
    input.suiAddress ? getSuiWalletOverview(input.suiAddress, { limit: 1 }) : Promise.resolve(null),
  ]);
  const solana = solanaResult.status === "fulfilled" ? solanaResult.value : null;
  const sui = suiResult.status === "fulfilled" ? suiResult.value : null;
  const now = Date.now();
  const solanaPwrc = integer(solana?.balance?.balanceBaseUnits);
  const suiWpwrc = integer(sui?.balance?.balanceBaseUnits);
  const principalEquivalentBaseUnits = solanaPwrc + suiWpwrc;
  const solanaAgeMs = checkedAge(solana?.checkedAt, now);
  const suiAgeMs = checkedAge(sui?.checkedAt, now);
  const staleLimit = maxAgeMs();
  const errors = {
    solana: solanaResult.status === "rejected" ? String(solanaResult.reason instanceof Error ? solanaResult.reason.message : solanaResult.reason) : null,
    sui: suiResult.status === "rejected" ? String(suiResult.reason instanceof Error ? suiResult.reason.message : suiResult.reason) : null,
  };
  const available = Number(Boolean(solana)) + Number(Boolean(sui));
  return {
    status: available === 2 ? "ready" : available === 1 ? "degraded" : "unavailable",
    balances: {
      solanaPwrcBaseUnits: solanaPwrc.toString(),
      suiWpwrcBaseUnits: suiWpwrc.toString(),
      principalEquivalentBaseUnits: principalEquivalentBaseUnits.toString(),
      decimals: 9,
      note: "Principal-equivalent wallet total only. This is not bridge backing or reconciliation evidence.",
    },
    gas: {
      solanaLamports: typeof solana?.balance?.nativeBalanceLamports === "string" ? solana.balance.nativeBalanceLamports : null,
      suiMist: typeof sui?.balance?.nativeBalanceMist === "string" ? sui.balance.nativeBalanceMist : null,
    },
    freshness: {
      maxAgeMs: staleLimit,
      solanaAgeMs,
      suiAgeMs,
      solanaStale: solanaAgeMs != null ? solanaAgeMs > staleLimit : Boolean(input.solanaAddress),
      suiStale: suiAgeMs != null ? suiAgeMs > staleLimit : Boolean(input.suiAddress),
    },
    chains: { solana, sui },
    errors,
    checkedAt: new Date(now).toISOString(),
    authoritativeForBridgeAccounting: false as const,
  };
}
