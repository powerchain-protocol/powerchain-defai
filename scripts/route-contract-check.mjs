import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const apiRoot = path.join(root, "apps/bridge/app/api/v1");
const actions = JSON.parse(fs.readFileSync(path.join(root,"shared/actions.json"),"utf8")).actions;
const configSource = fs.readFileSync(path.join(root,"apps/bridge/next.config.ts"),"utf8");
const errors = [];

const routeFiles = [];
function walk(dir){ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const p=path.join(dir,entry.name); if(entry.isDirectory()) walk(p); else if(entry.name === "route.ts") routeFiles.push(p); } }
walk(apiRoot);
for (const file of routeFiles) {
  const route = "/" + path.relative(path.join(root,"apps/bridge/app"),path.dirname(file)).split(path.sep).map((part)=>/^\[(.+)\]$/.test(part)?`:${part.slice(1,-1)}`:part).join("/");
  if (!actions.some((action)=>action.path===route)) errors.push(`API route missing from generated actions: ${route}`);
}
const redirects = [...configSource.matchAll(/\{\s*source:\s*"([^"]+)",\s*destination:\s*"([^"]+)"/g)].map((m)=>({source:m[1],destination:m[2]}));
for (const redirect of redirects) {
  if (redirect.source === redirect.destination) errors.push(`Self redirect: ${redirect.source}`);
  if (!redirect.destination.startsWith("/")) errors.push(`Redirect must stay framework-relative: ${redirect.source}`);
}
const sources = new Set();
for (const redirect of redirects) { if(sources.has(redirect.source)) errors.push(`Duplicate redirect source: ${redirect.source}`); sources.add(redirect.source); }
for (const source of ["/api", "/api/openapi", "/openapi", "/swagger"]) {
  const match = redirects.find((redirect)=>redirect.source===source);
  if (!match || match.destination !== "/api/v1/openapi") errors.push(`OpenAPI alias missing or invalid: ${source}`);
}
for (const [source,destination] of [["/api/bridge","/api/v1/bridge/openapi"],["/api/swap","/api/v1/swap/openapi"]]) {
  const match = redirects.find((redirect)=>redirect.source===source);
  if (!match || match.destination !== destination) errors.push(`Separated API alias missing or invalid: ${source}`);
}
for (const rel of ["api/swagger.yaml","api/postman/PowerChain-DeFAI.postman_collection.json","api/bridge/openapi.yaml","api/bridge/postman/PowerChain-Bridge.postman_collection.json","api/swap/openapi.yaml","api/swap/postman/PowerChain-Swap.postman_collection.json","tokens/metadata/pwrc.json","tokens/metadata/wpwrc.json"]) {
  if (!fs.existsSync(path.join(root,rel))) errors.push(`Root contract/token artifact missing: ${rel}`);
}
if (errors.length) { for (const error of errors) console.error(error); process.exit(1); }
console.log(`Route contract PASS — ${routeFiles.length} API route files, ${actions.length} actions, ${redirects.length} redirects`);
