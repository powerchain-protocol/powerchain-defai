import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const must=[
  "apps/bridge/components/wallet/data-quality-banner.tsx",
  "apps/bridge/components/wallet/transaction-detail-drawer.tsx",
  "apps/bridge/components/wallet/cross-chain-activity-list.tsx",
  "apps/bridge/components/wallet/wallet-action-center.tsx",
  "apps/bridge/hooks/use-wallet-action-safety.ts",
  "apps/bridge/components/bridge/bridge-claim-preflight-summary.tsx",
];
for(const rel of must){if(!fs.existsSync(path.join(root,rel)))throw new Error(`missing ${rel}`)}
const read=(rel)=>fs.readFileSync(path.join(root,rel),"utf8");
const activity=read("apps/bridge/components/wallet/cross-chain-activity-list.tsx");
const drawer=read("apps/bridge/components/wallet/transaction-detail-drawer.tsx");
const safety=read("apps/bridge/hooks/use-wallet-action-safety.ts");
const actions=read("apps/bridge/components/wallet/wallet-action-center.tsx");
const preflight=read("apps/bridge/components/bridge/bridge-claim-preflight-summary.tsx");
for(const token of ["TransactionDetailDrawer","aria-pressed","Load more","Not bridge accounting evidence"]){if(!activity.includes(token))throw new Error(`activity missing ${token}`)}
for(const token of ["aria-modal=\"true\"","Escape","navigator.clipboard","previousFocusRef"]){if(!drawer.includes(token))throw new Error(`drawer missing ${token}`)}
for(const token of ["walletChanged","Refresh chain data","online"]){if(!safety.includes(token))throw new Error(`safety missing ${token}`)}
for(const token of ["DataQualityBanner","runtimeReady","PWRC ↔ wPWRC · principal 1:1"]){if(!actions.includes(token))throw new Error(`actions missing ${token}`)}
for(const token of ["Bridge & claim readiness","server challenge","Existing transfer/claim status"]){if(!preflight.includes(token))throw new Error(`preflight missing ${token}`)}
const all=must.map(read).join("\n");
for(const forbidden of ["HELIUS_API_KEY","POWERCHAIN_GOVERNANCE_API_TOKEN","OPERATOR_API_TOKEN"]){if(all.includes(forbidden))throw new Error(`browser secret token present: ${forbidden}`)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(pkg.version!=="1.0.0")throw new Error(`root version must remain 1.0.0, got ${pkg.version}`);
console.log("wallet-flow-completion:production:check PASS");
