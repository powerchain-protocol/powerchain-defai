"use client";

export type PreflightState = {
  online?: boolean;
  walletConnected: boolean;
  correctNetwork: boolean;
  sufficientBalance: boolean;
  recipientValid: boolean;
  quoteReady: boolean;
  quoteExpired?: boolean;
  runtimeReady?: boolean;
};

export function BridgePreflightCard({ state, onConnect, onSwitchNetwork, onRefreshQuote }: { state: PreflightState; onConnect?: () => void; onSwitchNetwork?: () => void; onRefreshQuote?: () => void }) {
  const rows = [
    ...(state.runtimeReady === undefined ? [] : [["PowerChain runtime ready", state.runtimeReady] as const]),
    ["Internet connection", state.online !== false],
    ["Wallet connected", state.walletConnected],
    ["Correct source network", state.correctNetwork],
    ["Sufficient token balance", state.sufficientBalance],
    ["Destination address valid", state.recipientValid],
    ["Current quote available", state.quoteReady && !state.quoteExpired],
  ] as const;
  const ready = rows.every(([, ok]) => ok);
  const offline = state.online === false;
  return <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-preflight-title"><div className="flex items-center justify-between gap-3"><div><h2 id="bridge-preflight-title" className="text-sm font-semibold text-slate-950 dark:text-white">Ready to bridge</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All checks must pass before the wallet-signing step.</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ready ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}>{ready ? "Ready" : "Action needed"}</span></div><ul className="mt-4 space-y-2">{rows.map(([label, ok]) => <li key={label} className="flex items-center gap-2 text-sm"><span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-500 dark:bg-slate-900"}`}>{ok ? "✓" : "·"}</span><span className={ok ? "text-slate-700 dark:text-slate-200" : "text-slate-500 dark:text-slate-400"}>{label}</span></li>)}</ul>{offline ? <p role="status" className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">Reconnect before requesting a quote or opening a wallet signature.</p> : !state.walletConnected && onConnect ? <button type="button" onClick={onConnect} className="mt-4 min-h-10 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Connect wallet</button> : state.walletConnected && !state.correctNetwork && onSwitchNetwork ? <button type="button" onClick={onSwitchNetwork} className="mt-4 min-h-10 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Switch network</button> : state.quoteExpired && onRefreshQuote ? <button type="button" onClick={onRefreshQuote} className="mt-4 min-h-10 rounded-xl bg-[#0B1730] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Refresh quote</button> : null}</section>;
}
