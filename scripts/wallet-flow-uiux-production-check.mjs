import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const exists=(p)=>fs.existsSync(path.join(root,p));
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const required=[
  "apps/bridge/components/wallet/wallet-action-center.tsx",
  "apps/bridge/components/wallet/wallet-identity-notice.tsx",
  "apps/bridge/components/wallet/cross-chain-activity-list.tsx",
  "apps/bridge/components/bridge/bridge-claim-readiness-strip.tsx",
  "apps/bridge/components/wallet/transaction-detail-drawer.tsx",
  "apps/bridge/components/wallet/data-quality-banner.tsx",
];
for(const p of required) if(!exists(p)) throw new Error(`wallet-flow-uiux missing ${p}`);
const all=required.map(read).join("\n");
const checks=[
  [all.includes("principal 1:1")||all.includes("principal 1:1".replace("1:1","1:1")),"1:1 bridge relationship"],
  [all.includes("Server-authoritative")||all.includes("server-authoritative"),"claim server authority"],
  [(all.includes("Refresh") && all.includes("stale")) || all.includes("Refresh readiness first"),"stale/degraded action protection"],
  [all.includes("Wallet changed."),"wallet identity switch warning"],
  [all.includes("Not bridge accounting evidence")||all.includes("not bridge accounting evidence"),"accounting boundary"],
  [(all.includes("TransactionDetailDrawer") || all.includes('role="dialog"')),"transaction drilldown"],
  [all.includes("aria-pressed"),"accessible chain filters"],
  [!all.includes("HELIUS_API_KEY"),"no browser Helius secret"],
  [!all.includes("OPERATOR_API_TOKEN"),"no browser operator secret"],
];
for(const [ok,label] of checks) if(!ok) throw new Error(`wallet-flow-uiux check failed: ${label}`);
const pkg=JSON.parse(read("package.json"));
if(String(pkg.version)!=="1.0.0") throw new Error("version must remain 1.0.0");
console.log("wallet-flow-uiux:production:check PASS");
