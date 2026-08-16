import { fetchIntegrationJson } from "./http";
import { providerUrls } from "../config/provider-urls";
function key(){return process.env.COINGECKO_API_KEY?.trim();}
export function coinGeckoStatus(){return{provider:"coingecko" as const,configured:Boolean(key()),proUrl:providerUrls().coingeckoPro,publicUrl:providerUrls().coingeckoPublic,marketData:true,authoritativeForBridgeAccounting:false as const};}
export async function fetchCoinGeckoSimplePrice(ids:readonly string[],vsCurrencies:readonly string[]=["usd"]){const base=key()?providerUrls().coingeckoPro:providerUrls().coingeckoPublic;const url=new URL(`${base}/simple/price`);url.searchParams.set("ids",ids.slice(0,50).join(","));url.searchParams.set("vs_currencies",vsCurrencies.slice(0,10).join(","));return fetchIntegrationJson<Record<string,unknown>>(url.toString(),{headers:key()?{"x-cg-pro-api-key":key()!}:undefined},8_000);}
