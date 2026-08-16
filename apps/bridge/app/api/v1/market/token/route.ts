import {
  cachePolicy,
  cached,
  clientIpSecurityContext,
  consumeRateLimit,
  fetchBirdeyePrices,
  fetchCoinGeckoSimplePrice,
  fetchCoinMarketCapQuotes,
  fetchDexScreenerTokenPairs,
} from "@powerchain/backend";
import { ok, problem, requestId } from "@/server/http";
export const dynamic = "force-dynamic";
function clientKey(req:Request){return clientIpSecurityContext(req.headers).pseudonymousKey??"anonymous";}
export async function GET(req:Request){
  const limit=consumeRateLimit(`market:${clientKey(req)}`,60,60_000);
  if(!limit.ok)return problem("RATE_LIMITED","Too many market-data requests",429,requestId(req),{"Retry-After":String(Math.ceil(limit.retryAfterMs/1000))});
  const url=new URL(req.url),source=(url.searchParams.get("source")||"dexscreener").toLowerCase(),chain=(url.searchParams.get("chain")||"solana").toLowerCase(),address=url.searchParams.get("address")?.trim(),symbol=url.searchParams.get("symbol")?.trim().toUpperCase(),coinId=url.searchParams.get("coinId")?.trim().toLowerCase();
  try{
    const ttl=cachePolicy().marketsMs;
    const key=`market:${source}:${chain}:${address||symbol||coinId||""}`;
    const data=await cached(key,ttl,async()=>{
      if(source==="birdeye"){if(!address)throw new Error("ADDRESS_REQUIRED");return fetchBirdeyePrices([address],chain==="sui"?"sui":"solana")}
      if(source==="coinmarketcap"){if(!symbol)throw new Error("SYMBOL_REQUIRED");return fetchCoinMarketCapQuotes([symbol])}
      if(source==="coingecko"){if(!coinId)throw new Error("COIN_ID_REQUIRED");return fetchCoinGeckoSimplePrice([coinId])}
      if(!address)throw new Error("ADDRESS_REQUIRED");return fetchDexScreenerTokenPairs(chain,[address])
    });
    return ok({source,data,authoritativeForBridgeAccounting:false,cacheTtlMs:ttl},200,requestId(req),{"Cache-Control":`public, max-age=${Math.max(1,Math.floor(ttl/1000))}, stale-while-revalidate=${Math.max(5,Math.floor(ttl/500))}`,"X-RateLimit-Remaining":String(limit.remaining)});
  }catch(error){const code=error instanceof Error?error.message:"MARKET_PROVIDER_UNAVAILABLE";if(["ADDRESS_REQUIRED","SYMBOL_REQUIRED","COIN_ID_REQUIRED"].includes(code))return problem(code,code.replaceAll("_"," ").toLowerCase(),400,requestId(req));return problem("MARKET_PROVIDER_UNAVAILABLE","Market provider unavailable",503,requestId(req));}
}
