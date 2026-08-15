"use client";

import {useEffect, useMemo, useRef, useState} from "react";

function normalize(value?: string | null): string { return (value ?? "").trim(); }

export function useWalletSessionGuard(input: {solanaAddress?: string | null; suiAddress?: string | null}) {
  const identity = useMemo(() => `${normalize(input.solanaAddress)}|${normalize(input.suiAddress)}`, [input.solanaAddress, input.suiAddress]);
  const initial = useRef(identity);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (!initial.current) {
      initial.current = identity;
      return;
    }
    if (identity && identity !== initial.current) setChanged(true);
  }, [identity]);

  return {
    identity,
    changed,
    acknowledgeRefresh() {
      initial.current = identity;
      setChanged(false);
    },
  };
}
