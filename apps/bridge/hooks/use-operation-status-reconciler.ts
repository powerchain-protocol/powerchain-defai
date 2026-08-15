"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {OperationRecord,normalizeServerOperationObservation} from "../lib/bridge/operation-journal";
import {useOperationJournal} from "./use-operation-journal";

type SyncState="idle"|"syncing"|"synced"|"offline"|"unavailable"|"conflict";
const BASE_INTERVAL_MS=10_000,MAX_INTERVAL_MS=60_000;
function retryAfterMs(value:string|null){
  if(!value)return null;const seconds=Number(value);if(Number.isFinite(seconds)&&seconds>=0)return Math.min(MAX_INTERVAL_MS,seconds*1000);
  const date=Date.parse(value);return Number.isFinite(date)?Math.min(MAX_INTERVAL_MS,Math.max(0,date-Date.now())):null;
}

export function useOperationStatusReconciler(record:OperationRecord|null){
  const journal=useOperationJournal();const [state,setState]=useState<SyncState>("idle");const [error,setError]=useState<string|null>(null);const [lastSyncedAt,setLastSyncedAt]=useState<string|null>(null);
  const generation=useRef(0),etag=useRef<string|null>(null),timerRef=useRef<ReturnType<typeof setTimeout>|null>(null),intervalRef=useRef(BASE_INTERVAL_MS);
  const clearTimer=()=>{if(timerRef.current){clearTimeout(timerRef.current);timerRef.current=null;}};
  const refresh=useCallback(async()=>{
    if(!record?.statusApiHref){setState("idle");return BASE_INTERVAL_MS;}if(typeof navigator!=="undefined"&&!navigator.onLine){setState("offline");return BASE_INTERVAL_MS;}
    const current=++generation.current,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);setState("syncing");setError(null);
    try{
      const headers:Record<string,string>={accept:"application/json"};if(etag.current)headers["if-none-match"]=etag.current;
      const response=await fetch(record.statusApiHref,{method:"GET",cache:"no-store",headers,signal:controller.signal});if(current!==generation.current)return BASE_INTERVAL_MS;
      if(response.status===304){setLastSyncedAt(new Date().toISOString());setState("synced");intervalRef.current=Math.min(MAX_INTERVAL_MS,Math.max(BASE_INTERVAL_MS,intervalRef.current+5000));return intervalRef.current;}
      if(!response.ok){const retry=retryAfterMs(response.headers.get("retry-after"));if(response.status===429||response.status===503){intervalRef.current=retry??Math.min(MAX_INTERVAL_MS,intervalRef.current*2);}throw new Error(`STATUS_HTTP_${response.status}`);}
      const observation=normalizeServerOperationObservation(await response.json());if(!observation)throw new Error("INVALID_OPERATION_STATUS_RESPONSE");
      const headerSnapshot=response.headers.get("x-powerchain-operation-snapshot");
      if(headerSnapshot&&observation.snapshotId&&headerSnapshot!==observation.snapshotId)throw new Error("OPERATION_SNAPSHOT_HEADER_MISMATCH");
      journal.reconcile(observation);etag.current=response.headers.get("etag")??etag.current;setLastSyncedAt(new Date().toISOString());setState("synced");intervalRef.current=BASE_INTERVAL_MS;return BASE_INTERVAL_MS;
    }catch(err){if(current!==generation.current)return BASE_INTERVAL_MS;const message=err instanceof Error?err.message:"STATUS_UNAVAILABLE";setError(message);setState(message==="OPERATION_SERVER_REVISION_CONFLICT"?"conflict":typeof navigator!=="undefined"&&!navigator.onLine?"offline":"unavailable");intervalRef.current=Math.min(MAX_INTERVAL_MS,Math.max(BASE_INTERVAL_MS,intervalRef.current*2));return intervalRef.current;}
    finally{clearTimeout(timeout);}
  },[record?.id,record?.statusApiHref,journal.reconcile]);
  useEffect(()=>{
    clearTimer();etag.current=null;intervalRef.current=BASE_INTERVAL_MS;if(!record?.statusApiHref)return;
    let active=true;const schedule=async(delay=0)=>{clearTimer();timerRef.current=setTimeout(async()=>{if(!active)return;if(document.visibilityState!=="visible"){schedule(BASE_INTERVAL_MS);return;}const next=await refresh();if(active)schedule(next);},delay);};
    void schedule(0);const online=()=>void schedule(0),visible=()=>{if(document.visibilityState==="visible")void schedule(0);};window.addEventListener("online",online);document.addEventListener("visibilitychange",visible);
    return()=>{active=false;generation.current++;clearTimer();window.removeEventListener("online",online);document.removeEventListener("visibilitychange",visible);};
  },[record?.id,record?.statusApiHref,refresh]);
  return {state,error,lastSyncedAt,refresh};
}
