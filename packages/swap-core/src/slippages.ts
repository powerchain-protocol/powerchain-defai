export const SWAP_SLIPPAGE_PRESETS_BPS = [10, 50, 100] as const;
export const DEFAULT_SWAP_SLIPPAGE_BPS = 50;
export const MIN_SWAP_SLIPPAGE_BPS = 1;
export const MAX_SWAP_SLIPPAGE_BPS = 500;

export type SwapSlippagePresetBps = (typeof SWAP_SLIPPAGE_PRESETS_BPS)[number];

export function clampSwapSlippageBps(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_SWAP_SLIPPAGE_BPS;
  return Math.max(MIN_SWAP_SLIPPAGE_BPS, Math.min(MAX_SWAP_SLIPPAGE_BPS, Math.round(value)));
}

export function formatSwapSlippagePercent(bps: number): string {
  return `${(clampSwapSlippageBps(bps) / 100).toFixed(2)}%`;
}
