import Image from "next/image";
import Link from "next/link";

export function BridgeAssetSummary() {
  return <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950" aria-labelledby="bridge-assets-title">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#294a3b] dark:text-[#d0dcd6]">Assets</p><h2 id="bridge-assets-title" className="mt-1 text-sm font-semibold">Canonical route</h2><p className="mt-1 text-xs leading-5 text-slate-500">Default: wPWRC on Sui → PWRC on Solana.</p></div><Link href="/assets" className="text-xs font-semibold text-[#294a3b] hover:underline dark:text-[#d0dcd6]">Details</Link></div>
    <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"><Image src="/tokens/wpwrc.png" alt="" width={38} height={38} className="size-9 rounded-full object-cover" /><div className="mt-2 text-[11px] text-slate-500">Sui</div><div className="font-semibold">wPWRC</div><div className="text-[10px] font-semibold text-[#294a3b]">Bridged</div></div>
      <div className="grid size-8 place-items-center rounded-full border border-[#d4ddd8] bg-[#f1f4f2] text-sm text-[#294a3b]" aria-label="bridges to">→</div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-right dark:border-slate-800 dark:bg-slate-900"><Image src="/tokens/pwrc.png" alt="" width={38} height={38} className="ml-auto size-9 rounded-full object-cover" /><div className="mt-2 text-[11px] text-slate-500">Solana</div><div className="font-semibold">PWRC</div><div className="text-[10px] font-semibold text-[#294a3b] dark:text-[#d0dcd6]">Native</div></div>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f1f4f2] px-3 py-2 text-xs text-[#18352a] dark:bg-[#09110e]/50 dark:text-[#edf2ef]"><span className="block text-[10px] opacity-70">Principal</span><strong>1:1</strong></div><div className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-200"><span className="block text-[10px] text-slate-500">Protocol</span><strong>Wormhole NTT</strong></div></div>
  </section>;
}
