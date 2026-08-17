import { fail, ok, requestId } from "@/server/http";
import { getProgramRuntimeItem, isProgramRuntimeId } from "@/server/services/program-readiness";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request, context: { params: Promise<{ programId: string }> }) {
  const id = requestId(req);
  const { programId } = await context.params;
  if (!isProgramRuntimeId(programId)) return fail("PROGRAM_ID_INVALID", "Unknown protocol program.", 404, id, false);
  const force = new URL(req.url).searchParams.get("force") === "1";
  const item = await getProgramRuntimeItem(programId, { force });
  return ok(item, 200, id, {
    "cache-control": "no-store, max-age=0",
    "x-powerchain-program-state": item.state,
    "x-powerchain-program-timeout": String(item.timedOut),
    "x-powerchain-program-evidence-mode": item.evidenceMode,
  });
}
