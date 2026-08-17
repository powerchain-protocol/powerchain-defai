"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchProgramReadiness, fetchProgramReadinessItem } from "@/backend/program-client";
import type { ProgramReadinessPayload, ProgramRuntimeItem } from "@/types/programs";

function summarize(programs: readonly ProgramRuntimeItem[]): ProgramReadinessPayload {
  const required = programs.filter((item) => item.requiredForCoreBridge);
  return {
    checkedAt: new Date().toISOString(),
    ready: required.length > 0 && required.every((item) => item.verified && item.executable),
    configuredCount: programs.filter((item) => item.configured).length,
    verifiedCount: programs.filter((item) => item.verified).length,
    requiredCount: required.length,
    requiredVerifiedCount: required.filter((item) => item.verified && item.executable).length,
    executableCount: programs.filter((item) => item.executable).length,
    unavailableCount: programs.filter((item) => item.state === "unavailable").length,
    timedOutCount: programs.filter((item) => item.timedOut).length,
    programs,
    authoritativeForSettlement: false,
  };
}

export function useProgramReadiness(refreshMs = 60_000) {
  const [data, setData] = useState<ProgramReadinessPayload>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshingProgramId, setRefreshingProgramId] = useState<ProgramRuntimeItem["id"]>();
  const [clock, setClock] = useState(() => Date.now());
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const programController = useRef<AbortController | null>(null);
  const interval = Math.min(300_000, Math.max(15_000, refreshMs));
  const staleAfterMs = Math.max(60_000, interval * 2);

  const refresh = useCallback(async (force = false) => {
    const id = ++generation.current;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    setRefreshing(true);
    try {
      const result = await fetchProgramReadiness(next.signal, force);
      if (id !== generation.current) return;
      setData(result);
      setError(undefined);
    } catch (reason) {
      if (next.signal.aborted || id !== generation.current) return;
      setError(reason instanceof Error ? reason.message : "Program readiness unavailable");
    } finally {
      if (id === generation.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  const refreshProgram = useCallback(async (programId: ProgramRuntimeItem["id"], force = true) => {
    programController.current?.abort();
    const next = new AbortController();
    programController.current = next;
    setRefreshingProgramId(programId);
    try {
      const item = await fetchProgramReadinessItem(programId, next.signal, force);
      setData((current) => {
        if (!current) return current;
        const programs = current.programs.map((entry) => entry.id === item.id ? item : entry);
        return summarize(programs);
      });
      setError(undefined);
      return item;
    } catch (reason) {
      if (next.signal.aborted) return undefined;
      setError(reason instanceof Error ? reason.message : "Program verification unavailable");
      return undefined;
    } finally {
      if (programController.current === next) setRefreshingProgramId(undefined);
    }
  }, []);

  useEffect(() => {
    if (navigator.onLine) void refresh();
    else setLoading(false);
    const clockTimer = window.setInterval(() => setClock(Date.now()), 15_000);
    const timer = window.setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") void refresh();
    }, interval);
    const online = () => void refresh();
    const visible = () => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); };
    window.addEventListener("online", online);
    document.addEventListener("visibilitychange", visible);
    return () => {
      generation.current += 1;
      controller.current?.abort();
      programController.current?.abort();
      window.clearInterval(timer);
      window.clearInterval(clockTimer);
      window.removeEventListener("online", online);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [interval, refresh]);

  const staleProgramIds = new Set((data?.programs ?? []).filter((item) => {
    const checkedAt = Date.parse(item.checkedAt);
    return !Number.isFinite(checkedAt) || clock - checkedAt > staleAfterMs;
  }).map((item) => item.id));
  const coreEvidenceFresh = Boolean(data) && data.programs.filter((item) => item.requiredForCoreBridge).every((item) => !staleProgramIds.has(item.id));

  return { data, error, loading, refreshing, refreshingProgramId, staleProgramIds, coreEvidenceFresh, staleAfterMs, refresh, refreshProgram };
}
