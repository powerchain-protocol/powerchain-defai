"use client";

type Props={label:string;disabled?:boolean;pending?:boolean;reason?:string|null;onClick:()=>void};
export function MobileReviewActionBar({label,disabled=false,pending=false,reason,onClick}:Props){
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-4 pt-3 dark:border-slate-800 dark:bg-slate-950 sm:hidden" style={{paddingBottom:"calc(0.75rem + env(safe-area-inset-bottom))"}}>
    {reason&&<p className="mb-2 text-center text-xs text-slate-500" aria-live="polite">{reason}</p>}
    <button type="button" onClick={onClick} disabled={disabled||pending} aria-busy={pending} className="min-h-12 w-full rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-950">{pending?"Please wait…":label}</button>
  </div>;
}
