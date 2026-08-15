"use client";

import {useEffect,useMemo,useState} from "react";

export function useClaimReservationExpiry(expiresAt?:string|null){
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    if(!expiresAt)return;
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[expiresAt]);
  return useMemo(()=>{
    if(!expiresAt)return {expired:false,remainingMs:null as number|null};
    const ts=Date.parse(expiresAt);
    if(!Number.isFinite(ts))return {expired:true,remainingMs:0};
    const remainingMs=Math.max(0,ts-now);
    return {expired:remainingMs===0,remainingMs};
  },[expiresAt,now]);
}
