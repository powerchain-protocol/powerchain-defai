import { fetchPortfolio } from "@powerchain/backend/portfolio/fetch-portfolio";
import { fail, ok, requestId } from "@/server/http";
export const dynamic="force-dynamic";
export async function GET(req:Request){const id=requestId(req);try{const url=new URL(req.url);const solanaAddress=url.searchParams.get("solanaAddress");const suiAddress=url.searchParams.get("suiAddress");if(!solanaAddress&&!suiAddress)return fail("PORTFOLIO_WALLET_REQUIRED","Connect a Solana or Sui wallet",422,id,false);const data=await fetchPortfolio({solanaAddress,suiAddress});return ok(data,data.status==="unavailable"?503:200,id,{"Cache-Control":"no-store"});}catch{return fail("PORTFOLIO_UNAVAILABLE","Portfolio data is temporarily unavailable",503,id,true);}}
