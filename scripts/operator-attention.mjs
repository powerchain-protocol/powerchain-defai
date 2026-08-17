const rawBase = process.env.POWERCHAIN_DEPLOY_BASE_URL?.trim() || process.env.POWERCHAIN_SMOKE_BASE_URL?.trim();
const token = process.env.POWERCHAIN_OPERATOR_API_TOKEN?.trim();
if (!rawBase || !token) {
  console.error("POWERCHAIN_DEPLOY_BASE_URL (or POWERCHAIN_SMOKE_BASE_URL) and POWERCHAIN_OPERATOR_API_TOKEN are required");
  process.exit(2);
}
const base = rawBase.replace(/\/+$/, "");
const args = new Map(process.argv.slice(2).map((value) => {
  const index = value.indexOf("=");
  return index === -1 ? [value.replace(/^--/, ""), "true"] : [value.slice(0, index).replace(/^--/, ""), value.slice(index + 1)];
}));
const queue = args.get("queue");
if (queue && !["bridge", "claims", "fees"].includes(queue)) throw new Error("--queue must be bridge, claims, or fees");
const limitRaw = Number(args.get("limit") ?? 50);
const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.trunc(limitRaw))) : 50;
const before = args.get("before");
if (before && !Number.isFinite(new Date(before).getTime())) throw new Error("--before must be a valid ISO-8601 timestamp");

const url = new URL(`${base}/api/v1/operator/operations/attention`);
url.searchParams.set("limit", String(limit));
if (queue) url.searchParams.set("queue", queue);
if (before) url.searchParams.set("before", before);

const response = await fetch(url, {
  headers: { accept: "application/json", authorization: `Bearer ${token}` },
  cache: "no-store",
  redirect: "error",
});
let body;
try { body = await response.json(); } catch { throw new Error(`operator attention: invalid JSON (HTTP ${response.status})`); }
if (!response.ok || body?.ok !== true) throw new Error(`operator attention: HTTP ${response.status} ${body?.error?.code ?? "REQUEST_FAILED"}`);
console.log(JSON.stringify(body.data, null, 2));
