import { checkProviderHealth } from "@/server/services/provider-health";
import { fail, ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const health = await checkProviderHealth();
    const solana = health.providers.find((provider) => provider.provider === "solana");
    const sui = health.providers.find((provider) => provider.provider === "sui");
    if (!solana || !sui) throw new Error("PROVIDER_DIAGNOSTICS_INCOMPLETE");
    const data = {
      available: health.status !== "unavailable",
      generatedAt: health.checkedAt,
      processLocal: true as const,
      authoritativeForAccounting: false as const,
      chains: {
        solana: {
          status: solana.status,
          ok: solana.ok,
          endpoints: solana.endpoints,
          metrics: solana.metrics,
          ...(solana.latencyMs === undefined ? {} : { latencyMs: solana.latencyMs }),
          ...(solana.head === undefined ? {} : { head: solana.head }),
          ...(solana.source === undefined ? {} : { source: solana.source }),
        },
        sui: {
          status: sui.status,
          ok: sui.ok,
          endpoints: sui.endpoints,
          metrics: sui.metrics,
          ...(sui.latencyMs === undefined ? {} : { latencyMs: sui.latencyMs }),
          ...(sui.head === undefined ? {} : { head: sui.head }),
          ...(sui.source === undefined ? {} : { source: sui.source }),
        },
      },
    };
    return ok(data, 200, id, { "x-powerchain-provider-status": health.status });
  } catch (reason) {
    const detail = reason instanceof Error ? reason.name : "Unavailable";
    return fail("PROVIDER_DIAGNOSTICS_UNAVAILABLE", "Provider diagnostics are unavailable.", 503, id, true, { detail, authoritativeForAccounting: false });
  }
}
