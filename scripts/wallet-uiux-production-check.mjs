import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const req=[
  "apps/bridge/components/wallet/wallet-overview-shell.tsx",
  "apps/bridge/components/wallet/wallet-portfolio-card.tsx",
  "apps/bridge/components/bridge/bridge-asset-summary.tsx",
];
for(const p of req) if(!fs.existsSync(path.join(root,p))) throw new Error(`wallet-uiux missing ${p}`);
const shell=read(req[0]),card=read(req[1]);
const activityPath="apps/bridge/components/wallet/cross-chain-activity-list.tsx";
const activity=fs.existsSync(path.join(root,activityPath))?read(activityPath):shell;
const all=shell+"\n"+card+"\n"+activity;
for(const [ok,label] of [
  [all.includes("useWalletPortfolio"),"portfolio hook"],
  [all.includes("useWalletActivityFeed"),"activity hook"],
  [all.includes("useClaimEligibility"),"server claim eligibility UI"],
  [all.includes("1 PWRC = 1 wPWRC")||all.includes("principal 1:1"),"1:1 principal message"],
  [all.toLowerCase().includes("not bridge accounting evidence"),"accounting boundary"],
  [activity.includes("Load more"),"cursor pagination UI"],
  [shell.includes("Partial chain data"),"degraded data UX"],
  [all.includes("stale")||all.includes("Stale"),"stale data UX"],
  [activity.includes("aria-pressed"),"accessible activity filters"],
  [!all.includes("HELIUS_API_KEY"),"no browser Helius secret"],
  [!all.includes("OPERATOR_API_TOKEN"),"no browser operator secret"],
]) if(!ok) throw new Error(`wallet-uiux check failed: ${label}`);
const pkg=JSON.parse(read("package.json"));
if(String(pkg.version)!=="1.0.0") throw new Error("version must remain 1.0.0");
console.log("wallet-uiux:production:check PASS");
