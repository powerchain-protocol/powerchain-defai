"use client";
import { useCallback, useEffect, useState } from "react";
import { DEFAULT_SWAP_SLIPPAGE_BPS, clampSwapSlippageBps } from "@powerchain/swap-core";
const KEY="powerchain.swap.slippage-bps.v1";
export function useSlippageTolerance(initial=DEFAULT_SWAP_SLIPPAGE_BPS){
  const [slippageBps,setSlippageBpsState]=useState(()=>clampSwapSlippageBps(initial));
  useEffect(()=>{try{const raw=window.localStorage.getItem(KEY);if(raw)setSlippageBpsState(clampSwapSlippageBps(Number(raw)))}catch{}},[]);
  const setSlippageBps=useCallback((value:number)=>{const next=clampSwapSlippageBps(value);setSlippageBpsState(next);try{window.localStorage.setItem(KEY,String(next))}catch{}},[]);
  const reset=useCallback(()=>setSlippageBps(DEFAULT_SWAP_SLIPPAGE_BPS),[setSlippageBps]);
  return {slippageBps,setSlippageBps,reset};
}
