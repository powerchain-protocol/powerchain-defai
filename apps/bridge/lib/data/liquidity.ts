"use client";

import { apiFetch } from "@/lib/api/browser-api";

export type LiquidityPositions = { owner: string; providers: { raydium: { ok: boolean; stakePositions: number; lockedPositions: number }; meteora: { ok: boolean; openPositions: number }; orca: { ok: boolean; openPositions: null; note: string } }; checkedAt: string; authoritativeForBridgeAccounting: false };

export async function fetchLiquidityPositions(solanaAddress: string, signal?: AbortSignal): Promise<LiquidityPositions> {
  const params = new URLSearchParams({ solanaAddress });
  const response = await apiFetch(`/api/v1/liquidity/positions?${params}`, { cache: "no-store", signal });
  const body = await response.json() as { data?: LiquidityPositions; error?: { message?: string } };
  if (!response.ok || !body.data) throw new Error(body.error?.message || "LIQUIDITY_POSITIONS_UNAVAILABLE");
  return body.data;
}
