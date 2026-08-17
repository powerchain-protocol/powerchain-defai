"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StakingTransactionAction, StakingTransactionJournalEntry, StakingTransactionStatus } from "@powerchain/staking";
import { BRIDGE_API_ENDPOINTS } from "@/backend/endpoints";

const STORAGE_KEY = "powerchain.staking.transactions.v1";
const CHANNEL_NAME = "powerchain-staking-transactions";
const MAX_ENTRIES = 20;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const RECONCILE_MS = 15_000;
const terminal = new Set(["finalized", "failed"]);
const rank = Object.freeze({ submitted: 0, not_found: 0, processed: 1, confirmed: 2, finalized: 3, failed: 4 });

function safeRead(): StakingTransactionJournalEntry[] {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StakingTransactionJournalEntry[]; const cutoff=Date.now()-RETENTION_MS; return Array.isArray(value)?value.filter((entry)=>Date.parse(entry.updatedAt)>=cutoff).slice(0,MAX_ENTRIES):[]; } catch { return []; }
}
function safeWrite(entries: readonly StakingTransactionJournalEntry[]) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0,MAX_ENTRIES))); } catch {} }
function unwrap<T>(payload: { data?: T } | T): T { return typeof payload === "object" && payload !== null && "data" in payload && (payload as {data?:T}).data ? (payload as {data:T}).data : payload as T; }

export type StakingTransactionJournalController = ReturnType<typeof useStakingTransactionJournal>;

export function useStakingTransactionJournal(walletAddress?: string) {
  const [entries,setEntries]=useState<StakingTransactionJournalEntry[]>([]);
  const [reconciling,setReconciling]=useState(false);
  const channel=useRef<BroadcastChannel|null>(null);
  const reconcileLock=useRef(false);

  const commit=useCallback((next: StakingTransactionJournalEntry[])=>{ setEntries(next); safeWrite(next); channel.current?.postMessage(next); },[]);
  useEffect(()=>{ setEntries(safeRead()); if(typeof BroadcastChannel!=="undefined"){const c=new BroadcastChannel(CHANNEL_NAME); channel.current=c; c.onmessage=(event)=>{if(Array.isArray(event.data)){setEntries(event.data as StakingTransactionJournalEntry[]);safeWrite(event.data as StakingTransactionJournalEntry[]);}}; return()=>{c.close();channel.current=null;};} return;},[]);

  const recordSubmitted=useCallback((input:{action:StakingTransactionAction;signature:string;amountBaseUnits?:string})=>{ if(!walletAddress)return; const now=new Date().toISOString(); const entry:StakingTransactionJournalEntry={id:input.signature,walletAddress,action:input.action,signature:input.signature,state:"submitted",...(input.amountBaseUnits===undefined?{}:{amountBaseUnits:input.amountBaseUnits}),submittedAt:now,updatedAt:now}; commit([entry,...safeRead().filter((item)=>item.signature!==input.signature)].slice(0,MAX_ENTRIES)); },[commit,walletAddress]);

  const reconcile=useCallback(async()=>{ if(reconcileLock.current||!navigator.onLine)return; reconcileLock.current=true;setReconciling(true); try { const current=safeRead(); let changed=false; const next=await Promise.all(current.map(async(entry)=>{if(terminal.has(entry.state))return entry; try{const response=await fetch(`${BRIDGE_API_ENDPOINTS.staking.transactions}/${encodeURIComponent(entry.signature)}`,{cache:"no-store",headers:{accept:"application/json"}}); if(!response.ok)return entry; const status=unwrap(await response.json() as {data?:StakingTransactionStatus}|StakingTransactionStatus); const state=status.state==="not_found"?entry.state:status.state; if(state===entry.state && status.slot===entry.slot)return entry; changed=true; return {...entry,state,updatedAt:status.checkedAt,...(status.slot===undefined?{}:{slot:status.slot}),...(state==="failed"?{error:"Transaction failed on-chain."}:{})};}catch{return entry;}})); if(changed)commit(next); } finally {reconcileLock.current=false;setReconciling(false);} },[commit]);
  useEffect(()=>{void reconcile(); const interval=window.setInterval(()=>{if(document.visibilityState==="visible")void reconcile();},RECONCILE_MS); const onFocus=()=>void reconcile(); const onOnline=()=>void reconcile(); window.addEventListener("focus",onFocus);window.addEventListener("online",onOnline);return()=>{window.clearInterval(interval);window.removeEventListener("focus",onFocus);window.removeEventListener("online",onOnline);};},[reconcile]);
  const clear=useCallback((signature:string)=>commit(safeRead().filter((entry)=>entry.signature!==signature)),[commit]);
  const visible=useMemo(()=>entries.filter((entry)=>!walletAddress||entry.walletAddress===walletAddress).slice(0,6),[entries,walletAddress]);
  return {entries:visible,reconciling,recordSubmitted,reconcile,clear};
}
