import { normalizeChainAddress, normalizeSolanaAddress, normalizeSuiCoinType, type BlockchainChain } from "@powerchain/blockchain";

import { DEFAULT_SWAP_SLIPPAGE_BPS, MAX_SWAP_SLIPPAGE_BPS, MIN_SWAP_SLIPPAGE_BPS } from "./slippages";
export { DEFAULT_SWAP_SLIPPAGE_BPS, MAX_SWAP_SLIPPAGE_BPS, MIN_SWAP_SLIPPAGE_BPS, SWAP_SLIPPAGE_PRESETS_BPS, clampSwapSlippageBps, formatSwapSlippagePercent } from "./slippages";
export const POWERCHAIN_SWAP_FEE_BPS = 250;
export const SWAP_QUOTE_TTL_MS = 30_000;
export const BPS_DENOMINATOR = 10_000n;

export type SwapChain = BlockchainChain;
export type SwapProvider = "jupiter" | "cetus";
export type SwapVenue = "raydium" | "meteora" | "orca" | "cetus" | "other";
export type SwapExecutionState = "idle" | "quoting" | "review" | "awaiting-signature" | "submitted" | "confirmed" | "failed";
export type SwapFeeMode = "token-2022-native" | "cetus-overlay" | "none";

export type CanonicalSwapIntent = {
  chain: SwapChain;
  payer: string;
  inputAsset: string;
  outputAsset: string;
  amountBaseUnits: string;
  slippageBps: number;
};

export type SwapQuoteProtection = {
  quotedOutputBaseUnits: string;
  minimumOutputBaseUnits: string;
  slippageBps: number;
  expiresAt: string;
};

export function assertPositiveBaseUnits(value: unknown, code = "SWAP_AMOUNT_INVALID"): string {
  if (typeof value !== "string" || !/^[1-9][0-9]*$/.test(value)) throw new Error(code);
  return value;
}

export function assertSlippageBps(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < MIN_SWAP_SLIPPAGE_BPS || value > MAX_SWAP_SLIPPAGE_BPS) {
    throw new Error("SWAP_SLIPPAGE_OUT_OF_RANGE");
  }
  return value;
}

export function minimumOutputBaseUnits(outputBaseUnits: unknown, slippageBps: unknown): string {
  const output = BigInt(assertPositiveBaseUnits(outputBaseUnits, "SWAP_OUTPUT_INVALID"));
  const bps = BigInt(assertSlippageBps(slippageBps));
  return ((output * (BPS_DENOMINATOR - bps)) / BPS_DENOMINATOR).toString();
}

export function bpsFeeBaseUnits(amountBaseUnits: unknown, feeBps: unknown): string {
  const amount = BigInt(assertPositiveBaseUnits(amountBaseUnits));
  if (typeof feeBps !== "number" || !Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) throw new Error("SWAP_FEE_BPS_INVALID");
  return ((amount * BigInt(feeBps)) / BPS_DENOMINATOR).toString();
}

function normalizeAsset(chain: SwapChain, asset: unknown): string {
  if (chain === "SOLANA") return normalizeSolanaAddress(asset);
  return normalizeSuiCoinType(asset);
}

export function canonicalSwapIntent(input: CanonicalSwapIntent): CanonicalSwapIntent {
  const chain = input.chain;
  const payer = normalizeChainAddress(chain, input.payer);
  const inputAsset = normalizeAsset(chain, input.inputAsset);
  const outputAsset = normalizeAsset(chain, input.outputAsset);
  if (inputAsset === outputAsset) throw new Error("SWAP_PAIR_IDENTICAL");
  return {
    chain,
    payer,
    inputAsset,
    outputAsset,
    amountBaseUnits: assertPositiveBaseUnits(input.amountBaseUnits),
    slippageBps: assertSlippageBps(input.slippageBps),
  };
}

export function swapQuoteProtection(outputBaseUnits: unknown, slippageBps: unknown, nowMs = Date.now(), ttlMs = SWAP_QUOTE_TTL_MS): SwapQuoteProtection {
  if (!Number.isSafeInteger(nowMs) || nowMs < 0) throw new Error("SWAP_QUOTE_TIME_INVALID");
  if (!Number.isSafeInteger(ttlMs) || ttlMs < 1_000 || ttlMs > 300_000) throw new Error("SWAP_QUOTE_TTL_INVALID");
  const quotedOutputBaseUnits = assertPositiveBaseUnits(outputBaseUnits, "SWAP_OUTPUT_INVALID");
  const bps = assertSlippageBps(slippageBps);
  return {
    quotedOutputBaseUnits,
    minimumOutputBaseUnits: minimumOutputBaseUnits(quotedOutputBaseUnits, bps),
    slippageBps: bps,
    expiresAt: new Date(nowMs + ttlMs).toISOString(),
  };
}

export function isSwapQuoteFresh(expiresAt: unknown, nowMs = Date.now()): boolean {
  if (typeof expiresAt !== "string") return false;
  const expires = Date.parse(expiresAt);
  return Number.isFinite(expires) && expires > nowMs;
}

export function assertMinimumOutput(currentOutputBaseUnits: unknown, protectedMinimumBaseUnits: unknown): string {
  const current = BigInt(assertPositiveBaseUnits(currentOutputBaseUnits, "SWAP_OUTPUT_INVALID"));
  const minimum = BigInt(assertPositiveBaseUnits(protectedMinimumBaseUnits, "SWAP_MINIMUM_OUTPUT_INVALID"));
  if (current < minimum) throw new Error("SWAP_PRICE_PROTECTION_TRIGGERED");
  return current.toString();
}

export function canTransitionSwapState(from: SwapExecutionState, to: SwapExecutionState): boolean {
  const allowed: Record<SwapExecutionState, readonly SwapExecutionState[]> = {
    idle: ["quoting"],
    quoting: ["review", "failed", "idle"],
    review: ["quoting", "awaiting-signature", "idle", "failed"],
    "awaiting-signature": ["submitted", "failed"],
    submitted: ["confirmed", "failed"],
    confirmed: ["idle"],
    failed: ["idle", "quoting"],
  };
  return allowed[from].includes(to);
}

export function assertSwapStateTransition(from: SwapExecutionState, to: SwapExecutionState): void {
  if (!canTransitionSwapState(from, to)) throw new Error(`SWAP_STATE_TRANSITION_INVALID:${from}:${to}`);
}
