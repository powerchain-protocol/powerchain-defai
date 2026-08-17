import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const check = process.argv.includes("--check");
const apiRoot = path.join(root, "apps/bridge/app/api/v1");
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name === "route.ts") files.push(file);
  }
})(apiRoot);

const routes = files.map((file) => {
  const source = fs.readFileSync(file, "utf8");
  const relative = path.relative(path.join(root, "apps/bridge/app"), path.dirname(file)).split(path.sep).map((segment) => /^\[(.+)\]$/.test(segment) ? `:${segment.slice(1, -1)}` : segment).join("/");
  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"].filter((method) => new RegExp(`export\\s+async\\s+function\\s+${method}\\b|export\\s+function\\s+${method}\\b`).test(source));
  return { path: `/${relative}`, methods };
}).sort((a, b) => a.path.localeCompare(b.path));

const routeJson = JSON.stringify(routes, null, 2).replace(/"(GET|POST|PUT|PATCH|DELETE)"/g, '"$1"');
const appTs = `export interface ApiRouteDefinition { path: string; methods: readonly ("GET" | "POST" | "PUT" | "PATCH" | "DELETE")[]; }\n\nexport const API_ROUTES: readonly ApiRouteDefinition[] = ${routeJson} as const;\n`;
const sdkTs = `/** Generated from apps/bridge/app/api/v1. Do not edit manually. */\nexport const GENERATED_API_ROUTES = ${routeJson} as const;\nexport type GeneratedApiRoute = (typeof GENERATED_API_ROUTES)[number];\nexport type GeneratedApiPath = GeneratedApiRoute["path"];\nexport type GeneratedApiMethod = GeneratedApiRoute["methods"][number];\n`;

const actions = [];
for (const route of routes) for (const method of route.methods) {
  const auth = route.path.includes("/operator/") ? "operator" : "public";
  actions.push({ name: route.path.replace(/^\/api\/v1\//, "").replaceAll("/", ".").replace(/:([^.]+)/g, "$1") + "." + method.toLowerCase(), method, path: route.path, auth, idempotent: method === "GET" });
}
const appActions = JSON.stringify({ actions }, null, 2) + "\n";
const sharedActions = JSON.stringify({ version: "1.0.0", actions }, null, 2) + "\n";

const outputs = [
  ["apps/bridge/config/api-routes.ts", appTs],
  ["apps/bridge/actions.json", appActions],
  ["shared/actions.json", sharedActions],
  ["packages/sdk/src/generated/api-routes.ts", sdkTs],
];

for (const [relative, content] of outputs) {
  const target = path.join(root, relative);
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) throw new Error(`API registry drift: ${relative}`);
  } else {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}
console.log(`${check ? "Checked" : "Generated"} ${routes.length} API routes / ${actions.length} actions / SDK route registry`);
