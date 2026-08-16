const items = [
  ["Wallet-signed", "Private keys stay in your wallet"],
  ["Finality-verified", "Source and destination finality checked"],
  ["Reconciled", "Completion requires persisted evidence"],
  ["Transparent", "Fees and 1:1 principal shown before signing"],
] as const;

export function BridgeTrustStrip() {
  return <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Bridge safeguards">{items.map(([title, detail]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-2.5"><span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[#f1f4f2] text-xs font-bold text-[#294a3b] dark:bg-[#09110e]/60 dark:text-[#d0dcd6]">✓</span><div><p className="text-xs font-semibold text-slate-900 dark:text-white">{title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</p></div></div></div>)}</section>;
}
