"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StakingPositionStatus } from "@powerchain/staking";
import { BRIDGE_API_ENDPOINTS } from "@/backend/endpoints";

export function useStakingPosition(walletAddress: string | undefined, refreshKey = 0) {
  const [position, setPosition] = useState<StakingPositionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    const currentGeneration = ++generation.current;
    if (!walletAddress) { setPosition(null); setError(null); setLoading(false); return; }
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${BRIDGE_API_ENDPOINTS.staking.position}?wallet=${encodeURIComponent(walletAddress)}`, { cache: "no-store", signal: controller.signal, headers: { accept: "application/json" } });
      const payload = await response.json() as { data?: StakingPositionStatus; error?: { message?: string } };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? `Staking position request failed (${response.status}).`);
      if (generation.current === currentGeneration) setPosition(payload.data);
    } catch (reason) {
      if (generation.current !== currentGeneration) return;
      setPosition(null);
      setError(reason instanceof Error ? reason.message : "Unable to load staking position.");
    } finally {
      window.clearTimeout(timeout);
      if (activeController.current === controller) activeController.current = null;
      if (generation.current === currentGeneration) setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { void refresh(); return () => { generation.current += 1; activeController.current?.abort(); activeController.current = null; }; }, [refresh, refreshKey]);
  return { position, loading, error, refresh };
}
