import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const mustExist = (file) => { if (!fs.existsSync(file)) throw new Error(`missing operational route boundary: ${file}`); };
const mustContain = (file, token) => { const source = read(file); if (!source.includes(token)) throw new Error(`${file} missing ${token}`); };

const errorRoutes = ["swap", "chat", "explorer", "protocol", "staking", "profile", "settings"];
for (const route of errorRoutes) {
  const file = `apps/bridge/app/${route}/error.tsx`;
  mustExist(file);
  mustContain(file, "RouteErrorPanel");
}

for (const file of [
  "apps/bridge/app/profile/loading.tsx",
  "apps/bridge/app/settings/loading.tsx",
  "apps/bridge/app/bridge/status/[transferId]/loading.tsx",
  "apps/bridge/app/bridge/status/[transferId]/error.tsx",
  "apps/bridge/components/routing/route-error-panel.tsx",
]) mustExist(file);

const panel = read("apps/bridge/components/routing/route-error-panel.tsx");
if (panel.includes("error.message") || panel.includes("String(error)")) throw new Error("route error panel must not reflect raw exception messages");
if (!panel.includes("error?.digest")) throw new Error("route error panel should expose only the opaque framework digest for support correlation");
if (!panel.includes("RecoveryActions")) throw new Error("route error panel must keep canonical recovery navigation");

const history = read("apps/bridge/app/history/page.tsx");
if (!history.includes("bridgeStatusRoute(row.id)")) throw new Error("history must construct transfer detail routes with bridgeStatusRoute");
if (history.includes('href={`/bridge/status/${encodeURIComponent(row.id)}`}')) throw new Error("history must not manually construct transfer detail paths");

const endpointTests = read("apps/bridge/lib/settings/endpoint-tests.ts");
if (endpointTests.includes("error instanceof Error ? error.message") || endpointTests.includes("? error.message")) throw new Error("settings endpoint tests must not reflect raw browser/provider exception messages");

const tokenPicker = read("apps/bridge/components/assets/token-picker.tsx");
for (const token of ["triggerRef", "closePicker", "setQuery(\"\")"]) if (!tokenPicker.includes(token)) throw new Error(`token picker missing close/focus recovery marker: ${token}`);

const feeEstimator = read("apps/bridge/components/bridge/service-fee-estimator.tsx");
for (const token of ["AbortController", "ROUTE_ID", "requestRef.current?.abort()", "@/components/ui/select"]) if (!feeEstimator.includes(token)) throw new Error(`fee estimator missing hardening marker: ${token}`);

console.log("POWERCHAIN_OPERATIONAL_ROUTE_BOUNDARIES_CHECK_PASS");
