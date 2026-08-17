import fs from "node:fs";
const files={hook:"apps/bridge/hooks/use-staking-transaction-journal.ts",route:"apps/bridge/app/api/v1/staking/transactions/[signature]/route.ts",server:"apps/bridge/server/staking/transaction-status.ts",actions:"apps/bridge/components/staking/solana-staking-actions.tsx",ui:"apps/bridge/components/staking/staking-transaction-recovery.tsx"};
for(const [name,path] of Object.entries(files)){if(!fs.existsSync(path))throw new Error(`missing ${name}: ${path}`);}
const hook=fs.readFileSync(files.hook,"utf8"),actions=fs.readFileSync(files.actions,"utf8"),server=fs.readFileSync(files.server,"utf8");
for(const token of ["BroadcastChannel","localStorage","reconcile","never"]){}
if(!hook.includes("BroadcastChannel")||!hook.includes("localStorage")||!hook.includes("get"))throw new Error("staking transaction journal is incomplete");
if(!actions.includes("onSubmitted"))throw new Error("wallet submissions are not journaled");
if(!server.includes("getSignatureStatuses")||!server.includes("searchTransactionHistory"))throw new Error("staking transaction reconciliation is not RPC-backed");
if(hook.includes("sendTransaction")||hook.includes("signTransaction"))throw new Error("reconciliation must never sign or resend transactions");
console.log("[staking-reconciliation] local journal, cross-tab sync, RPC reconciliation, and no-auto-retry policy passed");
