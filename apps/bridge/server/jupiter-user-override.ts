import type { JupiterRequestOverride } from "@powerchain/backend/integrations/dex/jupiter";

export const JUPITER_KEY_HEADER = "x-powerchain-jupiter-api-key";
export const JUPITER_URL_HEADER = "x-powerchain-jupiter-api-url";

/** Parse transient browser/SDK Jupiter overrides without logging or persisting credential material. */
export function jupiterRequestOverride(request: Request): JupiterRequestOverride | undefined {
  const apiKey = request.headers.get(JUPITER_KEY_HEADER)?.trim() || "";
  const apiUrl = request.headers.get(JUPITER_URL_HEADER)?.trim() || "";
  return apiKey || apiUrl ? { apiKey, apiUrl } : undefined;
}
