"use client";

import { apiFetch } from "@/lib/api/browser-api";

export type PoolProvider = "raydium" | "meteora" | "orca" | "cetus" | "jupiter";
export type PoolData = { id: string; chain: "SOLANA" | "SUI"; provider: PoolProvider; name: string; tokenA: string; tokenB: string; tvlUsd: number | null; volume24hUsd: number | null; feeRatePct: number | null; source: string; fetchedAt: string };
export type PoolsResponse = { pools: PoolData[]; providers: Record<string, { ok: boolean; count: number }>; fetchedAt: string };

export async function fetchPools(input: { chain?: "SOLANA" | "SUI"; provider?: PoolProvider; signal?: AbortSignal } = {}): Promise<PoolsResponse> {
  const params = new URLSearchParams();
  if (input.chain) params.set("chain", input.chain);
  if (input.provider) params.set("provider", input.provider);
  const suffix = params.size ? `?${params}` : "";
  const response = await apiFetch(`/api/v1/pools${suffix}`, { cache: "no-store", signal: input.signal });
  const body = await response.json() as { data?: PoolsResponse; message?: string };
  if (!response.ok || !body.data) throw new Error(body.message || "POOLS_UNAVAILABLE");
  return body.data;
}
