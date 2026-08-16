import { liquidityOverview } from "@powerchain/backend/liquidity";
import { fail, ok, requestId } from "@/server/http";
export const dynamic="force-dynamic";
export async function GET(req:Request){const id=requestId(req);try{return ok(await liquidityOverview(),200,id,{"Cache-Control":"no-store"});}catch{return fail("LIQUIDITY_UNAVAILABLE","Liquidity discovery is temporarily unavailable",503,id,true);}}
