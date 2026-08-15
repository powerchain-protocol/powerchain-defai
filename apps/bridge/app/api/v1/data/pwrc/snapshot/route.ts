import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { getSolanaPwrcSnapshot, getSuiWpwrcSnapshot } from "@/server/services/chain-data";
import { checkPwrcAssetIntegrity } from "@/server/services/asset-integrity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const solanaOwner = url.searchParams.get("solanaOwner")?.trim() || undefined;
  const suiOwner = url.searchParams.get("suiOwner")?.trim() || undefined;
  const observedAt = new Date().toISOString();
  const [solana, sui, integrity] = await Promise.allSettled([
    getSolanaPwrcSnapshot(solanaOwner),
    getSuiWpwrcSnapshot(suiOwner),
    checkPwrcAssetIntegrity(),
  ]);
  const payload = {
    asset: "PWRC",
    observedAt,
    solana: solana.status === "fulfilled" ? { ok: true, data: solana.value } : { ok: false, error: solana.reason instanceof Error ? solana.reason.message : "Solana data unavailable" },
    sui: sui.status === "fulfilled" ? { ok: true, data: sui.value } : { ok: false, error: sui.reason instanceof Error ? sui.reason.message : "Sui data unavailable" },
    integrity: integrity.status === "fulfilled" ? { ok: integrity.value.healthy, data: integrity.value } : { ok: false, error: integrity.reason instanceof Error ? integrity.reason.message : "Integrity unavailable" },
    authoritativeForBridgeAccounting: false,
  };
  const snapshotId = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const hasChainData = payload.solana.ok || payload.sui.ok;
  return NextResponse.json({ ...payload, snapshotId }, {
    status: hasChainData ? 200 : 503,
    headers: { "cache-control": "no-store, max-age=0", "x-powerchain-snapshot": snapshotId },
  });
}
