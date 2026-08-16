"use client";
import { useEffect, useState } from "react";

type State = { loading:boolean; verified:boolean|null; receiver:string|null; authority:string|null; maximum:string|null };
function shortAccount(value: string | null): string { return value ? `${value.slice(0,6)}…${value.slice(-6)}` : "Not configured"; }
function record(value: unknown): Record<string,unknown>|null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string,unknown> : null; }
export function TransactionFeeSummary({ mode }: { mode:"swap"|"bridge" }) {
  const [state,setState]=useState<State>({loading:mode==="bridge",verified:null,receiver:null,authority:null,maximum:null});
  useEffect(()=>{
    if(mode!=="bridge") { setState({loading:false,verified:null,receiver:null,authority:null,maximum:null}); return; }
    const controller=new AbortController();
    void fetch('/api/v1/fees/token-2022',{signal:controller.signal,cache:'no-store'}).then(async(r)=>{const body:unknown=await r.json(); const root=record(body); const data=record(root?.data); if(!r.ok||!data) throw new Error('unavailable'); setState({loading:false,verified:data.verified250Bps===true,receiver:typeof data.receiverTokenAccount==='string'?data.receiverTokenAccount:null,authority:typeof data.withdrawWithheldAuthority==='string'?data.withdrawWithheldAuthority:null,maximum:typeof data.maximumFeeBaseUnits==='string'?data.maximumFeeBaseUnits:null});}).catch(()=>{if(!controller.signal.aborted)setState({loading:false,verified:false,receiver:null,authority:null,maximum:null});});return()=>controller.abort();
  },[mode]);
  if(mode==="swap") return <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-white/10 dark:bg-[#08110e] sm:grid-cols-3" aria-label="Swap fees">
    <div><p className="text-slate-500">PowerChain swap fee</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">2.5% · included in quote</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The Sui swap route uses the configured Cetus overlay fee. Sui assets are not Token-2022.</p></div>
    <div><p className="text-slate-500">Network fees</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Paid by connected wallet</p><p className="mt-1 text-[11px] leading-4 text-slate-500">No sponsored gas or hidden server-side payer. Your wallet approves the transaction.</p></div>
    <div><p className="text-slate-500">Price protection</p><p className="mt-1 font-semibold text-[#294a3b] dark:text-[#d0dcd6]">Minimum output enforced</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The transaction route is re-quoted before build and rejected if output falls below the protected minimum.</p></div>
  </div>;
  return <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs dark:border-white/10 dark:bg-[#08110e] sm:grid-cols-3" aria-label="Bridge fees">
    <div><p className="text-slate-500">PWRC native fee</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">2.5% · 250 bps</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Solana PWRC uses the Token-2022 transfer-fee extension only when the deployed mint verifies the configured policy.</p></div>
    <div><p className="text-slate-500">Network fees</p><p className="mt-1 font-semibold text-slate-900 dark:text-white">Paid by connected wallet</p><p className="mt-1 text-[11px] leading-4 text-slate-500">The wallet remains the signer and fee payer across the user-controlled transaction flow.</p></div>
    <div><p className="text-slate-500">PWRC fee configuration</p><p className={`mt-1 font-semibold ${state.verified?'text-[#294a3b] dark:text-[#d0dcd6]':'text-amber-700 dark:text-amber-300'}`}>{state.loading?'Checking…':state.verified?'Verified on-chain':'Not verified'}</p><dl className="mt-2 space-y-1 text-[11px] text-slate-500"><div className="flex justify-between gap-3"><dt>Fee receiver</dt><dd className="font-mono text-slate-700 dark:text-slate-300">{shortAccount(state.receiver)}</dd></div><div className="flex justify-between gap-3"><dt>Withdraw authority</dt><dd className="font-mono text-slate-700 dark:text-slate-300">{shortAccount(state.authority)}</dd></div>{state.maximum?<div className="flex justify-between gap-3"><dt>Max native fee</dt><dd className="font-mono text-slate-700 dark:text-slate-300">{state.maximum}</dd></div>:null}</dl></div>
  </div>;
}
