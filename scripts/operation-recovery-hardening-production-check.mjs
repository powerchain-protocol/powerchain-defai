import fs from "node:fs";import path from "node:path";const root=process.cwd();const files=[
"apps/bridge/lib/bridge/operation-journal.ts","apps/bridge/hooks/use-operation-journal.ts","apps/bridge/hooks/use-operation-status-reconciler.ts","apps/bridge/components/bridge/operation-recovery-center.tsx","apps/bridge/server/services/operation-status-snapshot.ts"];
for(const rel of files)if(!fs.existsSync(path.join(root,rel)))throw new Error(`missing ${rel}`);
const [journal,hook,sync,center,snapshot]=files.map(rel=>fs.readFileSync(path.join(root,rel),"utf8"));
for(const token of ['OPERATION_JOURNAL_KEY = "powerchain.operation-journal"','LEGACY_OPERATION_JOURNAL_KEYS','OPERATION_STATUS_REGRESSION','OPERATION_SERVER_REVISION_CONFLICT','serverRevision','terminalAt']){if(!journal.includes(token))throw new Error(`journal hardening missing ${token}`)}
if(/OPERATION_JOURNAL_KEY\s*=\s*"powerchain\.operation-journal\.v\d+"/.test(journal))throw new Error("versioned canonical journal key is forbidden");
if(/version\s*:\s*[0-9]+\s*;/.test(journal))throw new Error("versioned operation record is forbidden");
for(const token of ['type:"clear"','BroadcastChannel','advanceLocalOperation','sessionStorage']){if(!hook.includes(token))throw new Error(`journal hook missing ${token}`)}
for(const token of ['if-none-match','response.status===304','retry-after','429','503','MAX_INTERVAL_MS','AbortController']){if(!sync.includes(token))throw new Error(`reconciler missing ${token}`)}
for(const token of ['Status conflict','Server snapshot','do not start another mutation']){if(!center.includes(token))throw new Error(`recovery center missing ${token}`)}
for(const token of ['server-only','createHash','sha256','no-store, max-age=0','x-powerchain-operation-snapshot','operationStatusNotModified']){if(!snapshot.includes(token))throw new Error(`snapshot utility missing ${token}`)}
const client=[journal,hook,sync,center].join("\n");for(const secret of ["HELIUS_API_KEY","OPERATOR_API_TOKEN","POWERCHAIN_GOVERNANCE_API_TOKEN","privateKey","secretKey"]){if(client.includes(secret))throw new Error(`client recovery references secret ${secret}`)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));if(pkg.version!=="1.0.0")throw new Error(`version drift: ${pkg.version}`);console.log("operation recovery hardening production check PASS");
