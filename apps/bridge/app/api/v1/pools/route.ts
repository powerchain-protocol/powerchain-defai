import { fetchTrustedPools, type DexProvider } from "@powerchain/backend/data/pools";
import { fail, ok, requestId } from "@/server/http";
export const dynamic="force-dynamic";
const providers=new Set<DexProvider>(["cetus","jupiter","raydium","meteora","orca"]);
export async function GET(req:Request){const id=requestId(req);try{const url=new URL(req.url);const chainRaw=url.searchParams.get("chain")?.toUpperCase();const chain=chainRaw==="SOLANA"||chainRaw==="SUI"?chainRaw:undefined;const providerRaw=url.searchParams.get("provider")?.toLowerCase();const provider=providerRaw&&providers.has(providerRaw as DexProvider)?providerRaw as DexProvider:undefined;return ok(await fetchTrustedPools({ ...(chain === undefined ? {} : { chain }), ...(provider === undefined ? {} : { provider }) }),200,id,{"Cache-Control":"no-store"});}catch{return fail("POOLS_UNAVAILABLE","DEX pool discovery is temporarily unavailable",503,id,true);}}
