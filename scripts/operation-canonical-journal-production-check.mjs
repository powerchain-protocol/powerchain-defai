import fs from "node:fs";import path from "node:path";
const root=process.cwd();const journalPath=path.join(root,"apps/bridge/lib/bridge/operation-journal.ts");const hookPath=path.join(root,"apps/bridge/hooks/use-operation-journal.ts");
if(!fs.existsSync(journalPath)||!fs.existsSync(hookPath))throw new Error("canonical operation journal files missing");
const journal=fs.readFileSync(journalPath,"utf8"),hook=fs.readFileSync(hookPath,"utf8");
const checks=[
 [journal.includes('OPERATION_JOURNAL_KEY = "powerchain.operation-journal"'),"canonical storage key"],
 [journal.includes('OPERATION_JOURNAL_CHANNEL = "powerchain.operation-journal"'),"canonical BroadcastChannel"],
 [!journal.includes('OPERATION_JOURNAL_KEY = "powerchain.operation-journal.v'),"no versioned canonical key"],
 [!journal.includes('OPERATION_JOURNAL_CHANNEL = "powerchain.operation-journal.v'),"no versioned canonical channel"],
 [!(/version\s*:\s*[0-9]+\s*;/.test(journal)),"record has no schema-version field"],
 [journal.includes("LEGACY_OPERATION_JOURNAL_KEYS"),"legacy import aliases retained"],
 [hook.includes("writeRecord(parsed)")&&hook.includes("clearLegacyStorage"),"legacy data normalized immediately"],
 [hook.includes('Omit<OperationRecord,"createdAt"|"updatedAt"|"revision">'),"new records use canonical shape"],
];
let bad=0;for(const [ok,name] of checks){console.log(`${ok?"PASS":"FAIL"} ${name}`);if(!ok)bad++;}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));if(pkg.version!=="1.0.0"){console.log("FAIL release version 1.0.0");bad++;}else console.log("PASS release version 1.0.0");
if(bad)process.exit(1);
