import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const must=[
  "apps/bridge/hooks/use-review-freshness.ts",
  "apps/bridge/hooks/use-claim-reservation-expiry.ts",
  "apps/bridge/lib/ui/duration-format.ts",
  "apps/bridge/components/claim/claim-reservation-banner.tsx",
  "apps/bridge/components/bridge/review-freshness-alert.tsx",
  "apps/bridge/components/wallet/transaction-recovery-panel.tsx",
  "apps/bridge/components/bridge/mobile-review-action-bar.tsx",
];
for(const rel of must)if(!fs.existsSync(path.join(root,rel)))throw new Error(`missing ${rel}`);
const read=(rel)=>fs.readFileSync(path.join(root,rel),"utf8");
const all=must.map(read).join("\n");
for(const token of ["reviewed.id!==current.id","Review required again","Reservation expired","Submission outcome unknown","Do not resubmit","env(safe-area-inset-bottom)","aria-busy"]){if(!all.includes(token))throw new Error(`missing safety token: ${token}`)}
for(const forbidden of ["HELIUS_API_KEY","POWERCHAIN_GOVERNANCE_API_TOKEN","OPERATOR_API_TOKEN","Math.random()","toLocaleString("]){if(all.includes(forbidden))throw new Error(`forbidden browser token: ${forbidden}`)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(pkg.version!=="1.0.0")throw new Error(`root version must remain 1.0.0, got ${pkg.version}`);
console.log("review-recovery-uiux:production:check PASS");
