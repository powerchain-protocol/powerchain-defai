import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const req=[
  "apps/bridge/lib/claim/claim-lifecycle.ts",
  "apps/bridge/hooks/use-action-coordinator.ts",
  "apps/bridge/hooks/use-wallet-session-guard.ts",
  "apps/bridge/components/claim/claim-lifecycle-card.tsx",
  "apps/bridge/components/bridge/asset-route-availability.tsx",
  "apps/bridge/components/bridge/bridge-claim-action-orchestrator.tsx",
  "apps/bridge/components/wallet/wallet-session-safety.tsx",
];
for(const rel of req){if(!fs.existsSync(path.join(root,rel)))throw new Error(`missing ${rel}`)}
const lifecycle=fs.readFileSync(path.join(root,req[0]),"utf8");
for(const token of ["INVALID_CLAIM_TRANSITION","SUBMITTING","SUBMITTED","FINALIZED","UNKNOWN"]){if(!lifecycle.includes(token))throw new Error(`claim lifecycle missing ${token}`)}
const coord=fs.readFileSync(path.join(root,req[1]),"utf8");
if(!coord.includes("ACTION_BUSY:"))throw new Error("action coordinator busy lock missing");
const route=fs.readFileSync(path.join(root,req[4]),"utf8");
if(!route.includes("principal 1:1")||!route.includes("asset integrity"))throw new Error("route safety disclosure missing");
const wallet=fs.readFileSync(path.join(root,req[6]),"utf8");
if(!wallet.includes("Wallet changed")||!wallet.includes("opening another wallet signature"))throw new Error("wallet change safety missing");
const orch=fs.readFileSync(path.join(root,req[5]),"utf8");
if(!orch.includes("aria-busy")||!orch.includes("Claim PWRC")||!orch.includes("Bridge PWRC"))throw new Error("action UX contract missing");
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(pkg.version!=="1.0.0")throw new Error(`version must remain 1.0.0; got ${pkg.version}`);
console.log("claim/bridge orchestration UI/UX production check PASS");
