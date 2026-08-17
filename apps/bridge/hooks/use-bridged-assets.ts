"use client";
import { apiFetch } from "@/lib/api/browser-api";

import { useCallback, useEffect, useRef, useState } from "react";

export type BridgedAssetRow = {
  id: "pwrc-solana" | "wpwrc-sui";
  symbol: "PWRC" | "wPWRC";
  name: string;
  chain: "SOLANA" | "SUI";
  kind: "native" | "bridged";
  decimals: 9;
  identifier: string | null;
  configured: boolean;
  integrity: boolean;
};

export type BridgedAssetRegistry = {
  version: 1;
  canonicalAssetId: "powerchain-pwrc";
  principalRule: "1:1";
  authoritativeForBridgeAccounting: false;
  assets: BridgedAssetRow[];
  route: {
    protocol: "Wormhole NTT";
    solanaToSui: { source: "PWRC"; destination: "wPWRC" };
    suiToSolana: { source: "wPWRC"; destination: "PWRC" };
  };
  checkedAt: string;
};

function validRegistry(value: unknown): value is BridgedAssetRegistry {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return row.version === 1 && row.principalRule === "1:1" && Array.isArray(row.assets) && row.assets.length === 2;
}

export function useBridgedAssets() {
  const [data, setData] = useState<BridgedAssetRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8_000);
    setLoading(true);
    try {
      const response = await apiFetch("/api/v1/assets/bridge", { cache: "no-store", signal: controller.signal });
      const payload: unknown = await response.json();
      if (!response.ok || !validRegistry(payload)) throw new Error("Bridge asset registry unavailable");
      if (current !== generation.current) return;
      setData(payload);
      setError(null);
    } catch (cause) {
      if (current !== generation.current) return;
      setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Bridge asset registry timed out");
    } finally {
      window.clearTimeout(timer);
      if (current === generation.current) setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); return () => { generation.current += 1; }; }, [refresh]);
  return { data, loading, error, refresh };
}
