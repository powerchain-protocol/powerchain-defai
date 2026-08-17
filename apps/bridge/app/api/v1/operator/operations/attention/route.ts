import { getOperatorAttentionQueue, type OperatorAttentionQueue } from "@powerchain/backend/services/operations";
import { fail, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUEUES = new Set<OperatorAttentionQueue>(["bridge", "claims", "fees"]);

function parseBefore(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (!Number.isFinite(parsed.getTime())) throw new Error("INVALID_BEFORE_CURSOR");
  return parsed;
}

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);

    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit") ?? 50);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.trunc(rawLimit))) : 50;
    const rawQueue = url.searchParams.get("queue")?.trim().toLowerCase();
    if (rawQueue && !QUEUES.has(rawQueue as OperatorAttentionQueue)) {
      return fail("INVALID_QUEUE", "queue must be bridge, claims, or fees", 400, id, false);
    }

    const before = parseBefore(url.searchParams.get("before"));
    return ok(await getOperatorAttentionQueue({
      limit,
      ...(rawQueue ? { queue: rawQueue as OperatorAttentionQueue } : {}),
      ...(before ? { before } : {}),
    }), 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "OPERATOR_ATTENTION_QUERY_FAILED";
    if (code === "OPERATOR_UNAUTHORIZED") return fail(code, "Unauthorized", 401, id, false);
    if (code === "INVALID_BEFORE_CURSOR") return fail(code, "before must be a valid ISO-8601 timestamp", 400, id, false);
    return fail(code, "Unable to load operator attention queue", 503, id, true);
  }
}
