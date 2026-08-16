import fs from "node:fs";import path from "node:path";
const root=process.cwd();
const must=["apps/backend/src/claims/service.ts","apps/backend/src/integrations/dex/index.ts","apps/backend/src/services/explorer.ts","apps/backend/src/services/transactions.ts","apps/backend/src/services/operations.ts","apps/backend/src/workers/config.ts","apps/backend/src/workers/heartbeat.ts","apps/bridge/app/api/v1/operations/status/route.ts","apps/bridge/components/operations/operational-readiness-card.tsx"];
const missing=must.filter((p)=>!fs.existsSync(path.join(root,p)));if(missing.length)throw new Error(`BACKEND_ARCHITECTURE_MISSING: ${missing.join(", ")}`);
if(fs.existsSync(path.join(root,"backend")))throw new Error("ROOT_BACKEND_DUPLICATE_FORBIDDEN: use apps/backend only");
if(fs.existsSync(path.join(root,"apps/bridge/server/services/claim-service.ts")))throw new Error("CLAIM_SERVICE_DUPLICATE_FORBIDDEN");
for(const name of ["cetus","jupiter","raydium","meteora","orca"]){if(fs.existsSync(path.join(root,`apps/backend/src/integrations/${name}.ts`)))throw new Error(`DEX_DUPLICATE_FORBIDDEN:${name}`)}
const packageJson=JSON.parse(fs.readFileSync(path.join(root,"apps/backend/package.json"),"utf8"));for(const subpath of ["./integrations/dex/*","./workers","./services/explorer","./services/transactions"]){if(!packageJson.exports?.[subpath])throw new Error(`BACKEND_EXPORT_MISSING:${subpath}`)}
const historyPage=fs.readFileSync(path.join(root,"apps/bridge/app/history/page.tsx"),"utf8");
const historyRoute=fs.readFileSync(path.join(root,"apps/bridge/app/api/v1/bridge/history/route.ts"),"utf8");
if(historyPage.includes("@powerchain/database")||historyPage.includes("prisma."))throw new Error("HISTORY_PAGE_DATABASE_OWNERSHIP_FORBIDDEN");
if(historyRoute.includes("@powerchain/database")||historyRoute.includes("prisma."))throw new Error("HISTORY_API_DATABASE_OWNERSHIP_FORBIDDEN");
for(const worker of ["bridge","claims","fees"]){const source=fs.readFileSync(path.join(root,`apps/worker-${worker}/src/main.ts`),"utf8");if(source.includes("heartbeatWorker")||source.includes("removeWorkerHeartbeat"))throw new Error(`WORKER_HEARTBEAT_DUPLICATE_FORBIDDEN:${worker}`);if(!source.includes("createWorkerHeartbeat"))throw new Error(`WORKER_HEARTBEAT_CONTROLLER_REQUIRED:${worker}`)}
const operations=fs.readFileSync(path.join(root,"apps/backend/src/services/operations.ts"),"utf8");for(const token of ["getWorkerReadiness","checkDatabaseReady","bridgeTransfer.count","claim.count","bridgeServiceFeeSettlement.count","authoritativeForBridgeAccounting: false"]){if(!operations.includes(token))throw new Error(`OPERATIONS_SERVICE_CONTRACT_MISSING:${token}`)}
console.log("backend architecture production: PASS — canonical apps/backend, transaction/query ownership, DEX/services/workers and operational readiness consolidated");
