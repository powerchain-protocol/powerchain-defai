import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
function read(p){const f=path.join(root,p);if(!fs.existsSync(f))throw new Error(`missing ${p}`);return fs.readFileSync(f,"utf8")}
const journal=read("apps/bridge/lib/bridge/operation-journal.ts");
const hook=read("apps/bridge/hooks/use-operation-journal.ts");
const recovery=read("apps/bridge/components/bridge/operation-recovery-center.tsx");
const readiness=read("apps/bridge/components/bridge/action-readiness-summary.tsx");
const pkg=JSON.parse(read("package.json"));
const checks=[
  [pkg.version==="1.0.0","root version must remain 1.0.0"],
  [journal.includes("powerchain.operation-journal") && !journal.includes('const STORAGE_KEY = "powerchain.operation-journal.v'),"canonical operation journal missing"],
  [journal.includes("MAX_AGE_MS"),"operation journal TTL missing"],
  [journal.includes("statusHref.startsWith")||journal.includes("value.startsWith(\"/\")"),"status href safety missing"],
  [hook.includes("sessionStorage"),"session-scoped persistence missing"],
  [(hook+recovery+readiness).toLowerCase().includes("authoritative") || recovery.includes("status page"),"authority boundary missing"],
  [(recovery+readiness).toLowerCase().includes("do not") || recovery.includes("Status recovery"),"unknown outcome recovery warning missing"],
  [(recovery+readiness).includes("wallet") || recovery.includes("currentWalletIdentity"),"wallet change recovery missing"],
  [readiness.includes("No other mutation in progress"),"mutation readiness gate missing"],
  [readiness.includes("Server runtime, eligibility, reservation, quote and finality checks remain authoritative"),"server authority disclosure missing"],
];
for(const [ok,msg] of checks)if(!ok)throw new Error(msg);
console.log("operation recovery UI/UX production check PASS");
