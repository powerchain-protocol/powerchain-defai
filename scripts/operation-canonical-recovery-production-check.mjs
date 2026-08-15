import fs from "node:fs";import path from "node:path";
const root=process.cwd();const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const journal=read("apps/bridge/lib/bridge/operation-journal.ts");
const hook=read("apps/bridge/hooks/use-operation-journal.ts");
const center=read("apps/bridge/components/bridge/operation-recovery-center.tsx");
const presentation=read("apps/bridge/lib/bridge/operation-presentation.ts");
const service=read("apps/bridge/server/services/operation-status-service.ts");
const snapshot=read("apps/bridge/server/services/operation-status-snapshot.ts");
const checks=[
 [journal.includes('OPERATION_JOURNAL_KEY = "powerchain.operation-journal"'),"canonical journal key"],
 [journal.includes("OPERATION_TERMINAL_RETENTION_MS"),"shared terminal retention policy"],
 [journal.includes("operationTerminalExpiresAt")&&journal.includes("shouldPruneOperationRecord"),"canonical terminal cleanup helpers"],
 [hook.includes("OPERATION_ALREADY_ACTIVE")&&hook.includes("OPERATION_CONFLICT_ACTIVE"),"begin() blocks active/conflicting mutations"],
 [hook.includes("operationTerminalExpiresAt")&&hook.includes("setTimeout"),"live terminal cleanup timer"],
 [hook.includes("if(conflict&&!isOperationTerminal(conflict.record.status))return false"),"active conflict cannot be dismissed"],
 [presentation.includes("operationStatusLabel")&&presentation.includes("operationStatusSummary"),"shared status presentation"],
 [center.includes("operationStatusLabel")&&center.includes("operationStatusSummary"),"recovery center uses shared presentation"],
 [service.includes("serveCanonicalOperationStatus")&&service.includes("operationStatusResponse"),"canonical bridge/claim status service"],
 [service.includes("OPERATION_IDENTITY_MISMATCH")&&service.includes("INVALID_PERSISTED_OPERATION_REVISION"),"status identity/revision guards"],
 [snapshot.includes("status:304")&&snapshot.includes("no-store"),"ETag/no-store response contract retained"],
 [!journal.includes('OPERATION_JOURNAL_KEY = "powerchain.operation-journal.v'),"no versioned canonical journal"],
];
let bad=0;for(const [ok,name] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)bad++;}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));if(pkg.version!=="1.0.0"){console.log("FAIL release version 1.0.0");bad++;}else console.log("PASS release version 1.0.0");
if(bad)process.exit(1);
