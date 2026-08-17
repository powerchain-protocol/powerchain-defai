import { fail, json, ok, requestId } from "@/server/http";
import { enforceRateLimit } from "@/server/rate-limiter";
import { requireServiceFeeOperator } from "@/server/service-fee-auth";
import { getRuntimeMaintenance, updateRuntimeMaintenance } from "@/server/services/runtime-maintenance";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    return ok(await getRuntimeMaintenance(), 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "MAINTENANCE_QUERY_FAILED";
    if (code === "OPERATOR_UNAUTHORIZED") return fail(code, "Unauthorized", 401, id, false);
    return fail(code, "Unable to load maintenance state", 503, id, true);
  }
}

export async function PUT(req: Request) {
  const id = requestId(req);
  try {
    const actor = requireServiceFeeOperator(req);
    const rate = await enforceRateLimit("operator", req.headers, actor);
    if (!rate.allowed) return fail("RATE_LIMITED", "Too many operator requests", 429, id, true);
    const body = await json(req);
    if (!body || typeof body !== "object") return fail("INVALID_BODY", "JSON object required", 400, id, false);
    const input = body as Record<string, unknown>;
    if (typeof input.draining !== "boolean") return fail("INVALID_DRAINING", "draining must be boolean", 400, id, false);
    if (!Number.isInteger(input.expectedRevision) || Number(input.expectedRevision) < 0) return fail("INVALID_REVISION", "expectedRevision must be a non-negative integer", 400, id, false);
    if (input.reason !== undefined && input.reason !== null && typeof input.reason !== "string") return fail("INVALID_REASON", "reason must be a string", 400, id, false);
    const state = await updateRuntimeMaintenance({
      draining: input.draining,
      expectedRevision: Number(input.expectedRevision),
      ...(typeof input.reason === "string" ? { reason: input.reason } : {}),
      actor, requestId: id,
    });
    return ok(state, 200, id);
  } catch (error) {
    const code = error instanceof Error ? error.message : "MAINTENANCE_UPDATE_FAILED";
    if (code === "OPERATOR_UNAUTHORIZED") return fail(code, "Unauthorized", 401, id, false);
    if (code === "MAINTENANCE_REVISION_CONFLICT") return fail(code, "Maintenance state changed; reload before retrying", 409, id, false);
    if (code === "MAINTENANCE_ENV_OVERRIDE_ACTIVE") return fail(code, "Environment drain override is active and cannot be disabled through the API", 409, id, false);
    return fail(code, "Unable to update maintenance state", 503, id, true);
  }
}
