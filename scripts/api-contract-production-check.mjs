import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const must = (condition, message) => { if (!condition) failures.push(message); };
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const json = (relative) => JSON.parse(read(relative));

const registry = json("shared/actions.json");
const actions = registry.actions;
const routes = new Set(actions.map((action) => action.path));
const bridgeRoutes = new Set(actions.filter((action) => action.path.startsWith("/api/v1/bridge/")).map((action) => action.path));
const swapRoutes = new Set(actions.filter((action) => action.path.startsWith("/api/v1/swap/")).map((action) => action.path));

const swagger = read("api/swagger.yaml");
const bridge = read("api/bridge/openapi.yaml");
const swap = read("api/swap/openapi.yaml");
const runtimeOpenApi = read("apps/bridge/server/openapi.ts");
const apiReadme = read("api/README.md");

function pathCount(source) {
  return new Set([...source.matchAll(/^  (\/api\/v1\/[^:]+):$/gm)].map((match) => match[1])).size;
}
function operationCount(source) {
  return [...source.matchAll(/^      operationId:/gm)].length;
}

must(registry.version === "1.0.0", "shared/actions.json must declare API version 1.0.0");
must(routes.size > 0 && actions.length >= routes.size, "API registry must contain routes/actions");
must(swagger.includes("openapi: 3.1.0"), "combined API contract must use OpenAPI 3.1.0");
must(swagger.includes(`x-powerchain-route-count: ${routes.size}`), "combined OpenAPI route-count marker must match registry");
must(swagger.includes(`x-powerchain-action-count: ${actions.length}`), "combined OpenAPI action-count marker must match registry");
must(pathCount(swagger) === routes.size, `combined OpenAPI must document all ${routes.size} filesystem routes`);
must(operationCount(swagger) === actions.length, `combined OpenAPI must document all ${actions.length} route actions`);
must(pathCount(bridge) === bridgeRoutes.size, "Bridge OpenAPI must match canonical Bridge route count");
must(pathCount(swap) === swapRoutes.size, "Swap OpenAPI must match canonical Swap route count");
must(!bridge.includes("/api/v1/swap/"), "Bridge OpenAPI must not include Swap routes");
must(!swap.includes("/api/v1/bridge/"), "Swap OpenAPI must not include Bridge routes");
for (const contract of [swagger, bridge, swap]) {
  must(contract.includes("name: X-Api-Key"), "OpenAPI contracts must declare X-Api-Key security scheme");
  must(contract.includes("ErrorResponse:"), "OpenAPI contracts must declare a standard error schema");
  must(contract.includes("RateLimited:"), "OpenAPI contracts must declare a rate-limit response");
  must(contract.includes("requestId:"), "OpenAPI error schema must support request correlation");
}
for (const required of ["/api/v1/health", "/api/v1/ready", "/api/v1/version", "/api/v1/openapi"]) {
  must(swagger.includes(`  ${required}:`), `combined OpenAPI missing ${required}`);
}
must(runtimeOpenApi.includes('import { API_ROUTES } from "@/config/api-routes"'), "runtime OpenAPI must consume the generated filesystem route registry");
must(runtimeOpenApi.includes("buildCompletePaths()"), "runtime OpenAPI must fill undocumented routes from the registry");
must(apiReadme.includes("pnpm api:check"), "api/README.md must document the canonical API validation command");
must(apiReadme.includes("filesystem route registry"), "api/README.md must identify the route registry as canonical");

for (const manifest of ["api/package.json", "api/bridge/package.json", "api/swap/package.json"]) {
  const pkg = json(manifest);
  must(pkg.engines?.node === ">=24 <26", `${manifest} must use Node >=24 <26`);
  must(pkg.engines?.pnpm === ">=11.22.0 <12", `${manifest} must use pnpm >=11.22.0 <12`);
}

const datasetDir = path.join(root, "api/postman/datasets");
const datasets = fs.readdirSync(datasetDir).filter((name) => /PowerChain-DeFAI\.dataset\./.test(name));
must(datasets.length === 1 && datasets[0] === "PowerChain-DeFAI.dataset.csv", "Postman dataset source must remain CSV-only");

for (const relative of ["api/swagger.yaml", "api/bridge/openapi.yaml", "api/swap/openapi.yaml", "api/postman/PowerChain-DeFAI.postman_collection.json"]) {
  const source = read(relative);
  must(!/(BEGIN PRIVATE KEY|seed phrase|mnemonic|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*[^\s{}]+)/i.test(source), `${relative} must not contain secrets`);
}

if (failures.length) {
  for (const failure of failures) console.error(`[api-contract] ${failure}`);
  process.exit(1);
}
console.log(`API_CONTRACT_PRODUCTION_CHECK_PASS routes=${routes.size} actions=${actions.length} bridge=${bridgeRoutes.size} swap=${swapRoutes.size} openapi=3.1.0`);
