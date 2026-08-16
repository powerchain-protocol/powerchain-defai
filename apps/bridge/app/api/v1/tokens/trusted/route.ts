import { trustedTokenList } from "@powerchain/backend/data/trusted-token-list";
import { ok, requestId } from "@/server/http";
export const dynamic="force-dynamic";
export async function GET(req:Request){return ok({tokens:trustedTokenList(),source:"powerchain-trusted-token-list",checkedAt:new Date().toISOString()},200,requestId(req),{"Cache-Control":"public, max-age=60, stale-while-revalidate=300"});}
