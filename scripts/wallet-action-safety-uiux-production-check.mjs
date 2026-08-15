import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const must=[
  "apps/bridge/hooks/use-action-lock.ts",
  "apps/bridge/components/wallet/action-state-button.tsx",
  "apps/bridge/components/wallet/wallet-session-banner.tsx",
  "apps/bridge/components/bridge/bridge-claim-review-sheet.tsx",
  "apps/bridge/components/wallet/transaction-detail-drawer.tsx",
  "apps/bridge/lib/ui/activity-format.ts",
];
for(const rel of must){if(!fs.existsSync(path.join(root,rel)))throw new Error(`missing ${rel}`)}
const read=(rel)=>fs.readFileSync(path.join(root,rel),"utf8");
const lock=read(must[0]); const button=read(must[1]); const session=read(must[2]); const review=read(must[3]); const drawer=read(must[4]); const format=read(must[5]);
for(const token of ["lockedRef","if (lockedRef.current)","finally"]){if(!lock.includes(token))throw new Error(`action lock missing ${token}`)}
for(const token of ["aria-busy","pendingLabel","disabled={disabled || locked}"]){if(!button.includes(token))throw new Error(`action button missing ${token}`)}
for(const token of ["Wallet identity changed","Refresh session","shortIdentifier"]){if(!session.includes(token))throw new Error(`session banner missing ${token}`)}
for(const token of ["aria-modal=\"true\"","Escape","previousFocusRef","ActionStateButton","Final review"]){if(!review.includes(token))throw new Error(`review sheet missing ${token}`)}
for(const token of ["formatUtcTimestamp","Copy failed","previousFocusRef"]){if(!drawer.includes(token))throw new Error(`drawer missing ${token}`)}
for(const token of ["toISOString","UTC","shortIdentifier"]){if(!format.includes(token))throw new Error(`format util missing ${token}`)}
const client=must.map(read).join("\n");
for(const forbidden of ["HELIUS_API_KEY","POWERCHAIN_GOVERNANCE_API_TOKEN","OPERATOR_API_TOKEN","Math.random()","toLocaleString("]){if(client.includes(forbidden))throw new Error(`forbidden browser token: ${forbidden}`)}
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
if(pkg.version!=="1.0.0")throw new Error(`root version must remain 1.0.0, got ${pkg.version}`);
console.log("wallet-action-safety-uiux:production:check PASS");
