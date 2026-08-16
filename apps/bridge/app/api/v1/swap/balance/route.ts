import { getPowerChainSuiBalance } from "@powerchain/backend";
import { normalizeSuiAddress } from "@mysten/sui/utils";
import { configuredSwapAssets, type SwapAssetId } from "@/lib/swap/swap";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";

const ASSET_IDS = new Set<SwapAssetId>(["sui", "wpwrc", "usdc"]);

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const url = new URL(req.url);
    const address = normalizeSuiAddress(url.searchParams.get("address")?.trim() ?? "");
    const rawAsset = url.searchParams.get("asset")?.trim().toLowerCase() ?? "";
    if (!ASSET_IDS.has(rawAsset as SwapAssetId)) return fail("SWAP_ASSET_INVALID", "Unsupported swap asset", 422, id, false);
    const asset = configuredSwapAssets().find((item) => item.id === rawAsset);
    if (!asset) return fail("SWAP_ASSET_NOT_CONFIGURED", "Swap asset is not configured", 422, id, false);
    const balance = await getPowerChainSuiBalance(address, asset.coinType);
    return ok({
      address,
      asset: asset.id,
      symbol: asset.symbol,
      decimals: asset.decimals,
      balanceBaseUnits: balance.balanceBaseUnits,
      userPaysNetworkFees: true,
      gasReserveRequired: asset.id === "sui",
      authoritativeForSettlement: false,
      checkedAt: new Date().toISOString(),
    }, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    return fail("SWAP_BALANCE_UNAVAILABLE", error instanceof Error ? error.message : "Unable to load swap balance", 503, id, true);
  }
}
