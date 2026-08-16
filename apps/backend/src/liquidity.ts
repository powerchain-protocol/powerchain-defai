import { PublicKey } from "@solana/web3.js";
import { fetchIntegrationJson } from "./integrations/http";
import { fetchTrustedPools, type DexProvider } from "./data/pools";

function base(name:string,fallback:string){return process.env[name]?.trim().replace(/\/+$/,"")||fallback}
function countRows(value:unknown):number{if(Array.isArray(value))return value.length;if(!value||typeof value!=="object")return 0;const row=value as Record<string,unknown>;for(const key of ["data","positions","list","items"]){const nested=row[key];if(Array.isArray(nested))return nested.length;if(nested&&typeof nested==="object"){const n=countRows(nested);if(n)return n}}return 0}
async function safe(url:string){try{return{ok:true as const,data:await fetchIntegrationJson<unknown>(url,{},8_000)}}catch(error){return{ok:false as const,error:error instanceof Error?error.message:"UNAVAILABLE"}}}
export async function fetchSolanaLiquidityPositions(ownerInput:string){let owner:string;try{owner=new PublicKey(ownerInput).toBase58()}catch{throw new Error("SOLANA_WALLET_INVALID")}
 const raydiumBase=base("POWERCHAIN_RAYDIUM_OWNER_API_URL","https://owner-v1.raydium.io"),meteoraBase=base("POWERCHAIN_METEORA_API_URL","https://dlmm.datapi.meteora.ag");
 const [stake,locked,meteora]=await Promise.all([safe(`${raydiumBase}/position/stake/${owner}`),safe(`${raydiumBase}/position/clmm-lock/${owner}`),safe(`${meteoraBase}/portfolio/open?user=${encodeURIComponent(owner)}&page=1&page_size=50`)]);
 return{owner,providers:{raydium:{ok:stake.ok||locked.ok,stakePositions:stake.ok?countRows(stake.data):0,lockedPositions:locked.ok?countRows(locked.data):0},meteora:{ok:meteora.ok,openPositions:meteora.ok?countRows(meteora.data):0},orca:{ok:true,openPositions:null,note:"Orca position writes/reads use the official Whirlpools SDK boundary; public REST is used for pool discovery."}},checkedAt:new Date().toISOString(),authoritativeForBridgeAccounting:false as const};
}
export async function liquidityOverview(){const data=await fetchTrustedPools();const byProvider=Object.fromEntries((["raydium","meteora","orca","cetus"] as DexProvider[]).map(provider=>[provider,{pools:data.pools.filter(p=>p.provider===provider).length,ready:Boolean(data.providers[provider]?.ok)}]));return{...data,byProvider,settlementAuthority:false as const,note:"DEX liquidity is routing/discovery data only. Wormhole NTT remains bridge settlement authority."};}
