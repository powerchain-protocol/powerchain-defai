"use client";

import { useEffect, useState } from "react";
import type { ClusterDefinition } from "@powerchain/clusters";

type RuntimeDirectory = Readonly<{
  generatedAt: string;
  app: { baseUrl: string; reachable: boolean | null };
  clusters: readonly ClusterDefinition[];
}>;

export function useRuntimeDirectory() {
  const [data, setData] = useState<RuntimeDirectory | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/runtime", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Runtime directory failed (${response.status})`);
        return response.json() as Promise<RuntimeDirectory>;
      })
      .then(setData)
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Runtime directory unavailable"); });
    return () => controller.abort();
  }, []);
  return { data, error } as const;
}
