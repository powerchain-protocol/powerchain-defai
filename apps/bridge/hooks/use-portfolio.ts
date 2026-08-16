"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import {fetchPortfolio,type PortfolioData} from "@/lib/portfolio/fetch-portfolio";
export function usePortfolio(solanaAddress?:string|null,suiAddress?:string|null){
 const[data,setData]=useState<PortfolioData|null>(null),[loading,setLoading]=useState(false),[refreshing,setRefreshing]=useState(false),[error,setError]=useState<string|null>(null),[online,setOnline]=useState(()=>typeof navigator==="undefined"?true:navigator.onLine);const controller=useRef<AbortController|null>(null);
 const refresh=useCallback(async()=>{if(!solanaAddress&&!suiAddress){setData(null);setError(null);return}if(!online){setError("PORTFOLIO_OFFLINE");return}controller.current?.abort();const abort=new AbortController();controller.current=abort;data?setRefreshing(true):setLoading(true);try{setData(await fetchPortfolio({solanaAddress,suiAddress,signal:abort.signal}));setError(null)}catch(error){if(!abort.signal.aborted)setError(error instanceof Error?error.message:"PORTFOLIO_UNAVAILABLE")}finally{if(!abort.signal.aborted){setLoading(false);setRefreshing(false)}}},[solanaAddress,suiAddress,online,data]);
 useEffect(()=>{void refresh();return()=>controller.current?.abort()},[refresh]);
 useEffect(()=>{const update=()=>setOnline(navigator.onLine);window.addEventListener("online",update);window.addEventListener("offline",update);return()=>{window.removeEventListener("online",update);window.removeEventListener("offline",update)}},[]);
 useEffect(()=>{if(!online)return;const timer=window.setInterval(()=>{if(document.visibilityState==="visible")void refresh()},45_000);return()=>window.clearInterval(timer)},[online,refresh]);
 const stale=Boolean(data&&Date.now()-Date.parse(data.checkedAt)>90_000);
 return{data,loading,refreshing,error,online,stale,refresh};
}
