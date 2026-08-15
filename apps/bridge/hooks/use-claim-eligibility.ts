"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isClaimEligibility, type ClaimEligibility } from "@/lib/claim/claim-contract";

export function useClaimEligibility(walletAddress: string | null | undefined) {
  const [data, setData] = useState<ClaimEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const wallet = walletAddress?.trim();
    if (!wallet) { setData(null); setError(null); setLoading(false); return; }
    const current = ++generation.current;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8_000);
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/claims/eligibility?wallet=${encodeURIComponent(wallet)}`, { cache: "no-store", signal: controller.signal });
      const payload: unknown = await response.json();
      if (!response.ok || !isClaimEligibility(payload)) throw new Error(response.status === 404 ? "Claim eligibility endpoint is not available" : "Claim eligibility could not be verified");
      if (current !== generation.current) return;
      setData(payload); setError(null);
    } catch (cause) {
      if (current !== generation.current) return;
      setData(null); setError(cause instanceof Error && cause.name !== "AbortError" ? cause.message : "Claim eligibility request timed out");
    } finally {
      window.clearTimeout(timer);
      if (current === generation.current) setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { void refresh(); return () => { generation.current += 1; }; }, [refresh]);
  return { data, loading, error, refresh };
}
