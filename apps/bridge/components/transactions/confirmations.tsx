"use client";
export type ConfirmationItem = { id: string; label: string; ok: boolean; detail?: string };
export function TransactionConfirmations({items}:{items:readonly ConfirmationItem[]}){
  return <div className="grid gap-2 rounded-2xl border pc-hairline bg-white/45 p-3 dark:bg-white/[.02]" aria-label="Transaction preflight checks">{items.map((item)=><div key={item.id} className="flex items-start gap-2 text-xs"><span aria-hidden="true" className={`mt-px grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${item.ok?"bg-[#e1e8e4] text-[#294a3b] dark:bg-white/[.06] dark:text-[#d0dcd6]":"bg-amber-100 text-amber-800 dark:bg-amber-950/35 dark:text-amber-200"}`}>{item.ok?"✓":"!"}</span><span className={item.ok?"text-slate-700 dark:text-slate-200":"font-semibold text-amber-800 dark:text-amber-200"}>{item.label}{item.detail?<small className="mt-0.5 block font-normal opacity-70">{item.detail}</small>:null}</span></div>)}</div>;
}
