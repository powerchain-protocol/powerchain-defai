"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "powerchain.bridge.active-transfer.v1";

export type ResumableTransfer = { transferId: string; startedAt: string };

export function useResumableTransfer() {
  const [active, setActive] = useState<ResumableTransfer | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<ResumableTransfer>;
      if (typeof parsed.transferId === "string" && typeof parsed.startedAt === "string") setActive(parsed as ResumableTransfer);
    } catch { /* corrupted browser state is ignored */ }
  }, []);

  const remember = useCallback((transferId: string) => {
    const value = { transferId, startedAt: new Date().toISOString() };
    setActive(value);
    const json = JSON.stringify(value);
    try { sessionStorage.setItem(STORAGE_KEY, json); } catch {}
    try { localStorage.setItem(STORAGE_KEY, json); } catch {}
  }, []);

  const clear = useCallback(() => {
    setActive(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { active, remember, clear };
}
