import fs from "node:fs";
import path from "node:path";
const root=process.cwd(); let failed=0;
const exists=(p)=>fs.existsSync(path.join(root,p));
const text=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const ok=(condition,message)=>{console.log(`${condition?"PASS":"FAIL"} ${message}`); if(!condition)failed++;};
for(const p of [
  "apps/chat/src/charts.ts","apps/chat/src/prompts.ts","apps/chat/src/suggestions.tsx","apps/chat/src/hooks/use-saved-prompts.ts",
  "apps/chat/src/types/chat.ts","apps/chat/src/types/messages.ts","apps/chat/src/types/prompts.ts","apps/staking/src/services/staking.ts",
  "apps/bridge/app/chat/page.tsx","apps/bridge/app/staking/page.tsx","packages/protocol/src/ecosystem.ts","docs/DEFAI_ARCHITECTURE.md","docs/DEFAI_ECOSYSTEM.md"
]) ok(exists(p),`${p} exists`);
const ecosystem=text("packages/protocol/src/ecosystem.ts");
ok(ecosystem.includes('aiMayExecute: false')&&ecosystem.includes('settlementAuthority: "wormhole-ntt"'),"ecosystem pins AI non-execution and Wormhole NTT bridge settlement");
const chat=text("apps/backend/src/services/defai.ts");
ok(chat.includes("Never claim to have signed, submitted, finalized or settled")&&chat.includes("requiresWalletSignatureForActions: true"),"AI service cannot claim signing/finality and requires wallet boundary");
ok(chat.includes("15_000")&&chat.includes('cache: "no-store"'),"AI provider call is bounded and uncached");
const staking=text("apps/staking/src/services/staking.ts");
ok(staking.includes("POWERCHAIN_SOLANA_STAKING_PROGRAM_ID")&&staking.includes("POWERCHAIN_SUI_STAKING_PACKAGE_ID")&&staking.includes('state: solanaProgram && solanaVault ? "configured" : "disabled"'),"staking fails closed until real deployments configured");
const page=text("apps/bridge/app/staking/page.tsx");
ok(page.includes("No APR is fabricated")&&page.includes("AI may explain staking but cannot authorize or sign it"),"staking UI discloses no fabricated rewards and AI boundary");
const layout=text("apps/bridge/app/layout.tsx");
ok(layout.includes("PowerChain DeFAI")&&text("apps/bridge/app/page.tsx").includes('redirect("/chat")'),"PowerChain DeFAI is product identity and chat is entry point");
const rootPkg=JSON.parse(text("package.json"));
ok(rootPkg.name==="powerchain-defai"&&rootPkg.version==="1.0.0","root package rebranded without version change");
if(failed){console.error(`\n${failed} DeFAI checks failed`);process.exit(1);} console.log("\nPowerChain DeFAI production gate PASS");
