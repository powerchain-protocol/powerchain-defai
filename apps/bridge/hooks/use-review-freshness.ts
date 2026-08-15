"use client";

import {useEffect,useMemo,useRef,useState} from "react";

export type ReviewIdentity={
  id:string;
  expiresAt?:string|null;
  commitment?:string|null;
};

export function useReviewFreshness(current:ReviewIdentity|null, reviewed:ReviewIdentity|null){
  const [now,setNow]=useState(()=>Date.now());
  const previousIdRef=useRef(current?.id??null);
  useEffect(()=>{
    const timer=window.setInterval(()=>setNow(Date.now()),1000);
    return()=>window.clearInterval(timer);
  },[]);
  useEffect(()=>{previousIdRef.current=current?.id??null},[current?.id]);
  return useMemo(()=>{
    const expiresAt=current?.expiresAt?Date.parse(current.expiresAt):NaN;
    const expired=Number.isFinite(expiresAt)&&expiresAt<=now;
    const changed=Boolean(reviewed&&current&&(
      reviewed.id!==current.id||
      (reviewed.commitment??null)!==(current.commitment??null)||
      (reviewed.expiresAt??null)!==(current.expiresAt??null)
    ));
    const missing=!current||!reviewed;
    return {
      expired,
      changed,
      missing,
      valid:!expired&&!changed&&!missing,
      expiresInMs:Number.isFinite(expiresAt)?Math.max(0,expiresAt-now):null,
    };
  },[current,reviewed,now]);
}
