import { inspectPwrcToken2022FeeConfig } from "@powerchain/backend/fees/token2022-transfer-fee";
import { fail, ok, requestId } from "@/server/http";
import { solanaRpcUrls } from "@powerchain/backend/services/rpc";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const mint = process.env.POWERCHAIN_PWRC_SOLANA_MINT?.trim() || process.env.NEXT_PUBLIC_POWERCHAIN_PWRC_SOLANA_MINT?.trim();
    if (!mint) return fail("PWRC_MINT_NOT_CONFIGURED", "PWRC mint is not configured", 503, id, true);
    const rpc = solanaRpcUrls()[0];
    if (!rpc) return fail("SOLANA_RPC_NOT_CONFIGURED", "Solana RPC is not configured", 503, id, true);
    const config = await inspectPwrcToken2022FeeConfig({ rpcUrl: rpc, mint });
    return ok(config, 200, id, { "Cache-Control": "no-store" });
  } catch {
    return fail("PWRC_TOKEN_POLICY_INSPECTION_FAILED", "Unable to verify the canonical PWRC Token-2022 extension policy", 503, id, true);
  }
}
