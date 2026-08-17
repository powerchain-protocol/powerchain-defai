import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
const errors = [];
const routeSource = read("apps/bridge/config/app-routes.ts");
const nextSource = read("apps/bridge/next.config.ts");

for (const token of ["safeRouteSegment", "ROUTE_SEGMENT_PATTERN", "bridgeStatusRoute", "claimStatusRoute", "stakingTransactionApiRoute", "CANONICAL_PAGE_ROUTES"]) {
  if (!routeSource.includes(token)) errors.push(`Canonical route hardening missing: ${token}`);
}

for (const file of [
  "apps/bridge/app/global-error.tsx",
  "apps/bridge/app/robots.ts",
  "apps/bridge/components/routing/route-loading-shell.tsx",
  "apps/bridge/app/chat/loading.tsx",
  "apps/bridge/app/swap/loading.tsx",
  "apps/bridge/app/staking/loading.tsx",
  "apps/bridge/app/explorer/loading.tsx",
  "apps/bridge/app/status/loading.tsx",
]) if (!exists(file)) errors.push(`Routing runtime file missing: ${file}`);

if (!nextSource.includes("APP_REDIRECTS")) errors.push("Next redirect integration missing");

const redirectEntries = [...routeSource.matchAll(/\{ source: "([^"]+)", destination: (APP_ROUTES\.[A-Za-z0-9_]+|"[^"]+"), permanent: (?:true|false) \}/g)]
  .map((match) => ({ source: match[1], destinationExpression: match[2] }));
const sourceSet = new Set();
for (const entry of redirectEntries) {
  if (sourceSet.has(entry.source)) errors.push(`Duplicate redirect source: ${entry.source}`);
  sourceSet.add(entry.source);
}

const routeValues = Object.fromEntries([...routeSource.matchAll(/\s+([A-Za-z0-9_]+): "([^"]+)"/g)].map((m) => [m[1], m[2]]));
const redirects = redirectEntries.map((entry) => ({
  source: entry.source,
  destination: entry.destinationExpression.startsWith("APP_ROUTES.") ? routeValues[entry.destinationExpression.slice("APP_ROUTES.".length)] : entry.destinationExpression.slice(1, -1),
}));
for (const { source, destination } of redirects) {
  if (!destination) errors.push(`Redirect destination cannot be resolved: ${source}`);
  if (source === destination) errors.push(`Self redirect forbidden: ${source}`);
  if (sourceSet.has(destination)) errors.push(`Redirect chain forbidden: ${source} -> ${destination}`);
}

// Route-level loading is required for each high-frequency primary workspace.
for (const route of ["dashboard", "chat", "swap", "bridge", "staking", "wallet", "claim", "assets", "history", "explorer", "fees", "integrations", "status"]) {
  if (!exists(`apps/bridge/app/${route}/loading.tsx`)) errors.push(`Primary route missing loading boundary: /${route}`);
}

const globalError = read("apps/bridge/app/global-error.tsx");
for (const token of ["APP_ROUTES.history", "APP_ROUTES.status", "No wallet transaction"]) if (!globalError.includes(token)) errors.push(`Global error safety copy missing: ${token}`);

const claimClient = read("apps/bridge/components/claim/claim-page-client.tsx");
if (!claimClient.includes("claimStatusRoute(submitted.data.id)")) errors.push("Claim result navigation must use canonical claimStatusRoute builder");
if (claimClient.includes("`/claims/status/${submitted.data.id}`")) errors.push("Unsafe direct claim status interpolation remains");

if (errors.length) {
  for (const error of [...new Set(errors)]) console.error(error);
  process.exit(1);
}
console.log(`Routing runtime production check PASS — ${redirects.length} redirects are unique/unchained, primary routes have loading boundaries, dynamic route ids are bounded`);
