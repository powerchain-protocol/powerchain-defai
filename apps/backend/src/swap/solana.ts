import { PublicKey } from "@solana/web3.js";
import { assertPositiveBaseUnits, assertSlippageBps, canonicalSwapIntent } from "@powerchain/swap-core";
import { fetchIntegrationJson } from "../integrations/http";
import { trustedToken } from "../data/trusted-token-list";
import { persistSwapRouteSnapshot } from "../data/persistence";
import { recordSwapSubmission } from "./executions";

const JUPITER_BASE = "https://api.jup.ag/swap/v2";
const RAYDIUM_TRANSACTION_BASE = "https://transaction-v1.raydium.io";
function env(name: string): string | undefined { return process.env[name]?.trim() || undefined; }
function wallet(value: string): string { try { return new PublicKey(value).toBase58(); } catch { throw new Error("SOLANA_PAYER_INVALID"); } }
function headers(): HeadersInit { const key = env("JUPITER_API_KEY") || env("POWERCHAIN_JUPITER_API_KEY"); if (!key) throw new Error("JUPITER_API_KEY_REQUIRED"); return { "x-api-key": key }; }

export type SolanaSwapOrder = {
  provider: "jupiter";
  requestId: string;
  transaction: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold?: string;
  priceImpactPct?: string;
  router?: string;
  gasless?: boolean;
  expireAt?: string | null;
  lastValidBlockHeight?: number | null;
  routePlan?: unknown[];
  payer: string;
  userPaysNetworkFees: true;
};

type JupiterOrderResponse = Omit<SolanaSwapOrder, "provider" | "payer" | "userPaysNetworkFees"> & { error?: string; errorMessage?: string };
export async function createJupiterSwapOrder(input: { payer: string; inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number }): Promise<SolanaSwapOrder> {
  const canonical = canonicalSwapIntent({ chain: "SOLANA", payer: input.payer, inputAsset: input.inputMint, outputAsset: input.outputMint, amountBaseUnits: input.amountBaseUnits, slippageBps: input.slippageBps });
  const payer = wallet(canonical.payer); trustedToken("SOLANA", canonical.inputAsset); trustedToken("SOLANA", canonical.outputAsset);
  const url = new URL(`${env("POWERCHAIN_JUPITER_API_URL") || JUPITER_BASE}/order`);
  url.searchParams.set("inputMint", canonical.inputAsset); url.searchParams.set("outputMint", canonical.outputAsset); url.searchParams.set("amount", canonical.amountBaseUnits); url.searchParams.set("taker", payer); url.searchParams.set("slippageBps", String(canonical.slippageBps));
  const response = await fetchIntegrationJson<JupiterOrderResponse>(url.toString(), { headers: headers() }, 10_000);
  if (response.error || response.errorMessage || !response.transaction || !response.requestId || !response.outAmount) throw new Error("JUPITER_ORDER_UNAVAILABLE");
  await persistSwapRouteSnapshot({ chain:"SOLANA", provider:"jupiter", payer, inputAsset:canonical.inputAsset, outputAsset:canonical.outputAsset, inputBaseUnits:canonical.amountBaseUnits, outputBaseUnits:response.outAmount, minimumOutputBaseUnits:response.otherAmountThreshold ?? null, slippageBps:canonical.slippageBps, expiresAt:response.expireAt ?? null, route:{ router:response.router ?? "jupiter", routePlan:response.routePlan ?? [] } });
  return { ...response, provider: "jupiter", payer, userPaysNetworkFees: true };
}

export async function executeJupiterSwap(input: { payer: string; signedTransaction: string; requestId: string; lastValidBlockHeight?: number | null; inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number; minimumOutputBaseUnits?: string | null }) {
  wallet(input.payer);
  if (!/^[A-Za-z0-9+/=]+$/.test(input.signedTransaction) || input.signedTransaction.length < 100) throw new Error("SOLANA_SIGNED_TRANSACTION_INVALID");
  if (!/^[A-Za-z0-9_-]{8,256}$/.test(input.requestId)) throw new Error("JUPITER_REQUEST_ID_INVALID");
  const body: Record<string, unknown> = { signedTransaction: input.signedTransaction, requestId: input.requestId };
  if (Number.isSafeInteger(input.lastValidBlockHeight) && Number(input.lastValidBlockHeight) > 0) body.lastValidBlockHeight = input.lastValidBlockHeight;
  const result = await fetchIntegrationJson<{ status?: string; code?: number; signature?: string; error?: string; totalInputAmount?: string; totalOutputAmount?: string }>(`${env("POWERCHAIN_JUPITER_API_URL") || JUPITER_BASE}/execute`, { method: "POST", headers: { ...headers(), "content-type": "application/json" }, body: JSON.stringify(body) }, 15_000);
  if (result.status !== "Success" || !result.signature) throw new Error(result.error ? `JUPITER_EXECUTE_FAILED:${result.error}` : "JUPITER_EXECUTE_FAILED");
  await recordSwapSubmission({chain:"SOLANA",provider:"jupiter",payer:input.payer,inputAsset:input.inputMint,outputAsset:input.outputMint,inputBaseUnits:input.amountBaseUnits,quotedOutputBaseUnits:result.totalOutputAmount??null,minimumOutputBaseUnits:input.minimumOutputBaseUnits??null,slippageBps:input.slippageBps,transactionDigest:result.signature});
  return { ...result, provider: "jupiter" as const, payer: input.payer, submitted: true, authoritativeForBridgeAccounting: false as const };
}

export async function fetchRaydiumSwapQuote(input: { inputMint: string; outputMint: string; amountBaseUnits: string; slippageBps: number }) {
  trustedToken("SOLANA", input.inputMint); trustedToken("SOLANA", input.outputMint);
  const url = new URL(`${env("POWERCHAIN_RAYDIUM_TRANSACTION_API_URL") || RAYDIUM_TRANSACTION_BASE}/compute/swap-base-in`);
  url.searchParams.set("inputMint", input.inputMint); url.searchParams.set("outputMint", input.outputMint); url.searchParams.set("amount", assertPositiveBaseUnits(input.amountBaseUnits)); url.searchParams.set("slippageBps", String(assertSlippageBps(input.slippageBps))); url.searchParams.set("txVersion", "V0");
  return fetchIntegrationJson<unknown>(url.toString(), {}, 8_000);
}
