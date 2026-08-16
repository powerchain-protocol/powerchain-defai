import { fetchSolanaLiquidityPositions } from "@powerchain/backend/liquidity";
import { fail,ok,requestId } from "@/server/http";
export const dynamic="force-dynamic";
export async function GET(req:Request){const id=requestId(req);try{const owner=new URL(req.url).searchParams.get("solanaAddress")?.trim();if(!owner)return fail("LIQUIDITY_WALLET_REQUIRED","Solana wallet is required",422,id,false);return ok(await fetchSolanaLiquidityPositions(owner),200,id,{"Cache-Control":"no-store"});}catch(error){const code=error instanceof Error?error.message:"LIQUIDITY_POSITIONS_UNAVAILABLE";return fail(code,"Liquidity positions are temporarily unavailable",code.includes("INVALID")?422:503,id,!code.includes("INVALID"));}}
