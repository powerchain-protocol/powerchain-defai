"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type WalletActionSafetyInput = {
  solanaAddress?: string | null;
  suiAddress?: string | null;
  stale?: boolean;
  degraded?: boolean;
  runtimeReady?: boolean;
  online?: boolean;
};

export function useWalletActionSafety(input: WalletActionSafetyInput) {
  const identity = `${input.solanaAddress || ""}|${input.suiAddress || ""}`;
  const previousIdentity = useRef(identity);
  const [walletChanged, setWalletChanged] = useState(false);
  useEffect(() => {
    if (previousIdentity.current !== identity) { previousIdentity.current = identity; setWalletChanged(true); }
  }, [identity]);
  const blockReason = useMemo(() => {
    if (input.online === false) return "Reconnect to the internet before starting a new action.";
    if (walletChanged) return "Wallet changed. Refresh chain data before continuing.";
    if (input.stale) return "Wallet data is stale. Refresh before continuing.";
    if (input.runtimeReady === false) return "Bridge runtime is not ready.";
    if (input.degraded) return "Refresh degraded chain data before opening a new signature.";
    return null;
  }, [input.online, input.stale, input.runtimeReady, input.degraded, walletChanged]);
  return { walletChanged, blocked: Boolean(blockReason), blockReason, acknowledgeRefresh: () => setWalletChanged(false) };
}
