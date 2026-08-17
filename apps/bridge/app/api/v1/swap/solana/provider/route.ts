import { resolveJupiterRequestConfig } from "@powerchain/backend/integrations/dex/jupiter";
import { fail, ok, requestId } from "@/server/http";
import { jupiterRequestOverride } from "@/server/jupiter-user-override";

export const dynamic = "force-dynamic";

/** Validate the selected Jupiter provider policy without making a quote or transaction request. */
export async function GET(request: Request) {
  const id = requestId(request);
  try {
    const config = resolveJupiterRequestConfig(jupiterRequestOverride(request));
    const url = new URL(config.apiUrl);
    return ok({
      provider: "jupiter",
      accepted: true,
      source: config.source,
      apiOrigin: url.origin,
      apiPath: url.pathname.replace(/\/+$/, ""),
      apiKeyConfigured: Boolean(config.apiKey),
      credentialPersisted: false,
    }, 200, id, { "Cache-Control": "no-store" });
  } catch (error) {
    const code = error instanceof Error ? error.message : "JUPITER_PROVIDER_CONFIG_INVALID";
    const serverUnavailable = code === "JUPITER_API_KEY_REQUIRED";
    return fail(
      code,
      serverUnavailable ? "Deployment Jupiter credentials are unavailable" : "Selected Jupiter configuration is not accepted",
      serverUnavailable ? 503 : 422,
      id,
      serverUnavailable,
    );
  }
}
