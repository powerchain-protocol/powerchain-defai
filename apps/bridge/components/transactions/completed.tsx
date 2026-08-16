"use client";
export function TransactionCompleted({chain,digest,explorerUrl,label="Transaction submitted",finalityNotice="Submission is not settlement finality."}:{chain:"SOLANA"|"SUI";digest:string;explorerUrl:string;label?:string;finalityNotice?:string}){
  return <section className="rounded-2xl border border-[#c7d4cd] bg-[#f1f4f2] p-3 text-xs text-[#214233] dark:border-white/10 dark:bg-white/[.045] dark:text-[#edf2ef]" aria-label={`${chain} transaction receipt`}>
    <div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-full bg-white/80 font-bold dark:bg-black/25" aria-hidden="true">✓</span><strong>{label}</strong></div>
    <p className="mt-2 text-[11px] opacity-75">{finalityNotice}</p>
    <a href={explorerUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-8 items-center font-bold underline underline-offset-2">View {chain==="SOLANA"?"Solana":"Sui"} transaction · {digest.slice(0,10)}…{digest.slice(-8)}</a>
  </section>;
}
