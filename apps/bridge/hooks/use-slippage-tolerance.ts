"use client";

import { useCallback } from "react";
import { DEFAULT_SWAP_SLIPPAGE_BPS, clampSwapSlippageBps } from "@powerchain/swap-core";
import { useUserSettings } from "@/context/user-settings-context";

export function useSlippageTolerance(initial = DEFAULT_SWAP_SLIPPAGE_BPS) {
  const { settings, updateSettings } = useUserSettings();
  const slippageBps = clampSwapSlippageBps(settings.swap.slippageBps ?? initial);
  const setSlippageBps = useCallback((value: number) => {
    updateSettings({ swap: { ...settings.swap, slippageBps: clampSwapSlippageBps(value) } });
  }, [settings.swap, updateSettings]);
  const reset = useCallback(() => setSlippageBps(DEFAULT_SWAP_SLIPPAGE_BPS), [setSlippageBps]);
  return { slippageBps, setSlippageBps, reset };
}
