"use client";
export type PoolProvider="raydium"|"meteora"|"orca"|"cetus"|"jupiter";
export type PoolData={id:string;chain:"SOLANA"|"SUI";provider:PoolProvider;name:string;tokenA:string;tokenB:string;tvlUsd:number|null;volume24hUsd:number|null;feeRatePct:number|null;source:string;fetchedAt:string};
export type PoolsResponse={pools:PoolData[];providers:Record<string,{ok:boolean;count:number}>;fetchedAt:string};
export async function fetchPools(input:{chain?:"SOLANA"|"SUI";provider?:PoolProvider;signal?:AbortSignal}={}):Promise<PoolsResponse>{const url=new URL("/api/v1/pools",window.location.origin);if(input.chain)url.searchParams.set("chain",input.chain);if(input.provider)url.searchParams.set("provider",input.provider);const response=await fetch(url,{cache:"no-store",signal:input.signal});const body=await response.json() as {data?:PoolsResponse;message?:string};if(!response.ok||!body.data)throw new Error(body.message||"POOLS_UNAVAILABLE");return body.data;}
