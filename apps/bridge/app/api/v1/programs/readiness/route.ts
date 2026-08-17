import { getProgramReadiness } from "@/server/services/program-readiness";
import { ok, requestId } from "@/server/http";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const id = requestId(req);
  const force = new URL(req.url).searchParams.get("force") === "1";
  const status = await getProgramReadiness({ force });
  return ok(status, 200, id, { "cache-control": "no-store, max-age=0", "x-powerchain-programs-verified": String(status.verifiedCount), "x-powerchain-programs-timeout": String(status.timedOutCount), "x-powerchain-programs-evidence-mode": force ? "live" : "cache-eligible" });
}
