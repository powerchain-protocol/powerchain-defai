"use client";

import { useCallback, useRef, useState } from "react";

export function useActionLock() {
  const lockedRef = useRef(false);
  const [locked, setLocked] = useState(false);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | undefined> => {
    if (lockedRef.current) return undefined;
    lockedRef.current = true;
    setLocked(true);
    try {
      return await action();
    } finally {
      lockedRef.current = false;
      setLocked(false);
    }
  }, []);

  return { locked, run };
}
