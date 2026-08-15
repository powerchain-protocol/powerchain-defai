"use client";

import {useCallback, useMemo, useRef, useState} from "react";

export type CoordinatedAction = "bridge" | "claim" | null;

export function useActionCoordinator() {
  const [activeAction, setActiveAction] = useState<CoordinatedAction>(null);
  const activeRef = useRef<CoordinatedAction>(null);

  const run = useCallback(async <T,>(kind: Exclude<CoordinatedAction, null>, fn: () => Promise<T>): Promise<T> => {
    if (activeRef.current) {
      throw new Error(`ACTION_BUSY:${activeRef.current}`);
    }
    activeRef.current = kind;
    setActiveAction(kind);
    try {
      return await fn();
    } finally {
      activeRef.current = null;
      setActiveAction(null);
    }
  }, []);

  return useMemo(() => ({
    activeAction,
    busy: activeAction !== null,
    bridgeBlocked: activeAction !== null && activeAction !== "bridge",
    claimBlocked: activeAction !== null && activeAction !== "claim",
    run,
  }), [activeAction, run]);
}
