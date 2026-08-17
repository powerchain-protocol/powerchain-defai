"use client";

import { apiFetch } from "@/lib/api/browser-api";

export type PortfolioBalance = { tokenId: string; chain: "SOLANA" | "SUI"; symbol: string; address: string; balanceBaseUnits: string; decimals: number };
export type PortfolioData = { wallets: { solana: string | null; sui: string | null }; balances: PortfolioBalance[]; errors: { solana?: string; sui?: string }; status: "ready" | "degraded" | "unavailable"; checkedAt: string; authoritativeForBridgeAccounting: false };

export async function fetchPortfolio(input: { solanaAddress?: string | null; suiAddress?: string | null; signal?: AbortSignal }): Promise<PortfolioData> {
  const params = new URLSearchParams();
  if (input.solanaAddress) params.set("solanaAddress", input.solanaAddress);
  if (input.suiAddress) params.set("suiAddress", input.suiAddress);
  const suffix = params.size ? `?${params}` : "";
  const response = await apiFetch(`/api/v1/portfolio${suffix}`, { cache: "no-store", signal: input.signal });
  const body = await response.json() as { data?: PortfolioData; message?: string };
  if (!response.ok && response.status !== 503) throw new Error(body.message || "PORTFOLIO_UNAVAILABLE");
  if (!body.data) throw new Error(body.message || "PORTFOLIO_UNAVAILABLE");
  return body.data;
}
