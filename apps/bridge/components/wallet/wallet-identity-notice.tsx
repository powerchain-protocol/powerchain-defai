"use client";

import { useEffect, useRef, useState } from "react";

export function WalletIdentityNotice({ solanaAddress, suiAddress, onRefresh }: { solanaAddress?: string | null; suiAddress?: string | null; onRefresh?: () => void }) {
  const previous = useRef<string | null>(null);
  const [changed, setChanged] = useState(false);
  const identity = `${solanaAddress || "-"}|${suiAddress || "-"}`;

  useEffect(() => {
    if (previous.current !== null && previous.current !== identity) setChanged(true);
    previous.current = identity;
  }, [identity]);

  if (!changed) return null;
  return (
    <div role="status" className="mt-4 flex flex-col gap-3 rounded-xl border border-[#d4ddd8] bg-[#f1f4f2] p-3 text-sm text-[#18352a] dark:border-[#29483c]/50 dark:bg-[#09110e]/40 dark:text-[#edf2ef] sm:flex-row sm:items-center sm:justify-between">
      <div><strong>Wallet changed.</strong> Refreshing chain data before a new bridge or claim prevents using balances from the previous wallet.</div>
      <button type="button" onClick={() => { setChanged(false); onRefresh?.(); }} className="min-h-9 shrink-0 rounded-lg border border-[#aebdb5] px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35584a] dark:border-[#35584a]">Refresh now</button>
    </div>
  );
}
