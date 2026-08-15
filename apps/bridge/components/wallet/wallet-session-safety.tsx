"use client";

export function WalletSessionSafety({changed, stale, offline, onRefresh}:{changed:boolean; stale:boolean; offline:boolean; onRefresh?:()=>void}) {
  if (!changed && !stale && !offline) return null;
  const title = offline ? "You are offline" : changed ? "Wallet changed" : "Wallet data is stale";
  const body = offline
    ? "New bridge and claim actions are paused. Existing transfer status can be checked again after connectivity returns."
    : changed
      ? "Refresh balances, eligibility, and runtime state before opening another wallet signature."
      : "Refresh wallet and chain data before opening another wallet signature.";
  return <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
    <p className="font-semibold">{title}</p><p className="mt-1 text-sm">{body}</p>
    {onRefresh && !offline ? <button type="button" onClick={onRefresh} className="mt-3 min-h-11 rounded-xl border border-amber-300 px-4 text-sm font-semibold dark:border-amber-800">Refresh data</button> : null}
  </div>;
}
