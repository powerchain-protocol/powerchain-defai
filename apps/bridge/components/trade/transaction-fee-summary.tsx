"use client";
import { apiFetch } from "@/lib/api/browser-api";
import { useEffect, useState } from "react";

type State = { loading:boolean; compliant:boolean|null; extensionPresent:boolean|null };
function record(value: unknown): Record<string,unknown>|null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : null; }
export function TransactionFeeSummary({ mode }: { mode:"swap"|"bridge" }) {
  const [state,setState]=useState<State>({loading:mode==="bridge",compliant:null,extensionPresent:null});
  useEffect(()=>{
    if(mode!=="bridge") { setState({loading:false,compliant:null,extensionPresent:null}); return; }
    const controller=new AbortController();
    void apiFetch('/api/v1/fees/token-2022',{signal:controller.signal,cache:'no-store'}).then(async(r)=>{
      const body:unknown=await r.json(); const root=record(body); const data=record(root?.data);
      if(!r.ok||!data) throw new Error('unavailable');
      setState({loading:false,compliant:data.canonicalPolicyCompliant===true,extensionPresent:data.transferFeeExtensionPresent===true});
    }).catch(()=>{if(!controller.signal.aborted)setState({loading:false,compliant:false,extensionPresent:null});});
    return()=>controller.abort();
  },[mode]);
  if(mode==="swap") return <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-white/10 dark:bg-[#08110e] sm:grid-cols-3" aria-label="Swap fees">
    <div><p className="text-slate-500">PowerChain swap fee</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">2.5% · included in quote</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The configured Sui swap route applies its overlay fee separately from PWRC token policy.</p></div>
    <div><p className="text-slate-500">Network fees</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Paid by connected wallet</p><p className="mt-1 text-[11px] leading-4 text-slate-500">No sponsored gas or hidden server-side payer. Your wallet approves the transaction.</p></div>
    <div><p className="text-slate-500">Price protection</p><p className="mt-1 font-semibold text-[#294a3b] dark:text-[#d0dcd6]">Minimum output enforced</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The transaction route is re-quoted before build and rejected if output falls below the protected minimum.</p></div>
  </div>;
  return <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-white/10 dark:bg-[#08110e] sm:grid-cols-3" aria-label="Bridge fees">
    <div><p className="text-slate-500">PWRC native transfer fee</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Disabled</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Canonical PWRC does not use Token-2022 TransferFeeConfig. Bridge principal remains 1:1.</p></div>
    <div><p className="text-slate-500">PowerChain service fee</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Governed separately</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Any route service fee is quoted and settled separately from canonical bridge principal and network gas.</p></div>
    <div><p className="text-slate-500">Token policy</p><p className={`mt-1 font-semibold ${state.compliant?'text-[#294a3b] dark:text-[#d0dcd6]':'text-amber-700 dark:text-amber-300'}`}>{state.loading?'Checking…':state.compliant?'Verified on-chain':'Not verified'}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{state.extensionPresent===true?'Transfer-fee extension detected; execution must remain blocked.':state.compliant?'Transfer-fee extension absent as required.':'Unable to verify the deployed mint policy.'}</p></div>
  </div>;
}
