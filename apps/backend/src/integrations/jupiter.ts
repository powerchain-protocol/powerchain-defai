import { fetchIntegrationJson, configuredUrl } from "./http";
export type JupiterQuote = { inputMint?: string; outputMint?: string; inAmount?: string; outAmount?: string; otherAmountThreshold?: string; priceImpactPct?: string; routePlan?: unknown[] };
export async function fetchJupiterQuote(input: { inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number }): Promise<JupiterQuote> {
  const url = new URL(`${configuredUrl("POWERCHAIN_JUPITER_API_URL")}/quote`);
  url.searchParams.set("inputMint", input.inputMint); url.searchParams.set("outputMint", input.outputMint); url.searchParams.set("amount", input.amountBaseUnits); url.searchParams.set("slippageBps", String(input.slippageBps));
  return fetchIntegrationJson<JupiterQuote>(url.toString());
}
