import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (ok, message) => { if (!ok) throw new Error(message); };

const proxy = read("apps/bridge/proxy.ts");
const routes = read("apps/backend/src/routing/routes.ts");
const router = read("apps/backend/src/routing/router.ts");
const recovery = read("apps/bridge/components/navigation/recovery-actions.tsx");
const bridgeError = read("apps/bridge/app/bridge/error.tsx");

for (const header of ["x-powerchain-route-id", "x-powerchain-route-risk", "x-powerchain-rate-class", "server-timing"]) {
  assert(proxy.includes(header), `proxy missing ${header}`);
}
assert(proxy.includes("resolveCoreRoute(request.method, request.nextUrl.pathname)"), "proxy route metadata must come from canonical backend routing");
assert(proxy.includes("Unknown routes remain compatible"), "proxy must remain non-blocking for non-critical generated API routes");
assert(!proxy.includes("JSON.stringify(request"), "proxy must not serialize request content into diagnostics");
assert(routes.includes("export function matchCoreRoute"), "core router must expose parameter-aware matching");
assert(routes.includes("export function allowedMethodsForCorePath"), "core router must expose method discovery");
assert(router.includes("params: Readonly<Record<string, string>>"), "route resolution must expose trusted dynamic params separately from labels");
assert(router.includes("API_METHOD_NOT_ALLOWED"), "registered-path method mismatches must be distinguishable from unknown routes");
assert(recovery.includes("APP_ROUTES.history") && recovery.includes("APP_ROUTES.status"), "recovery actions must use canonical routes");
assert(bridgeError.includes("RecoveryActions"), "bridge error must use shared recovery navigation");
assert(!bridgeError.includes('href="/history"'), "bridge error must not hard-code history path");

console.log("[route-observability] critical route metadata, param-safe matching, and shared recovery navigation passed");
