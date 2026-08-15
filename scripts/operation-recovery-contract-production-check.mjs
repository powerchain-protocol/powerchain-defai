import fs from "node:fs";import path from "node:path";
const root=process.cwd();const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const journal=read("apps/bridge/lib/bridge/operation-journal.ts");const hook=read("apps/bridge/hooks/use-operation-journal.ts");const sync=read("apps/bridge/hooks/use-operation-status-reconciler.ts");const snap=read("apps/bridge/server/services/operation-status-snapshot.ts");
const checks=[
 [journal.includes('OPERATION_JOURNAL_KEY = "powerchain.operation-journal"')&&journal.includes('OPERATION_JOURNAL_CHANNEL = "powerchain.operation-journal"'),"single canonical journal key/channel"],
 [!journal.includes('version: 4;')&&!journal.includes('version: 5;')&&!journal.includes('record.version!=='),"no journal schema-version contract"],
 [journal.includes("LEGACY_OPERATION_JOURNAL_KEYS")&&hook.includes("clearLegacyStorage"),"legacy aliases normalize into canonical storage"],
 [journal.includes("isSafeOperationStatusHref")&&journal.includes("decodeURIComponent"),"status deep-link validation"],
 [hook.includes("externalConflict")&&hook.includes("current.id!==incoming.id"),"cross-tab different-operation conflict"],
 [hook.includes("hasBlockingOperation")&&hook.includes("!!externalConflict"),"conflict blocks mutations"],
 [sync.includes("x-powerchain-operation-snapshot")&&sync.includes("OPERATION_SNAPSHOT_HEADER_MISMATCH"),"snapshot header/body binding"],
 [snap.includes("operationStatusResponse")&&snap.includes("status:304"),"server ETag/304 response helper"],
 [snap.includes("x-content-type-options")&&snap.includes("no-store"),"status response hardening"],
];
let bad=0;for(const [ok,name] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)bad++;}if(bad)process.exit(1);
