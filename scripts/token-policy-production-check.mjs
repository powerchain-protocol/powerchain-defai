import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const fail=(message)=>{console.error(`token-policy: FAIL ${message}`);process.exitCode=1;};
const token=JSON.parse(fs.readFileSync(path.join(root,"config/token.json"),"utf8"));
const expected={mint:"PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc",decimals:9,whole:"18446000000",base:"18446000000000000000"};
if(token.information?.solana?.mint!==expected.mint) fail("canonical mint drift");
if(token.information?.decimals!==expected.decimals) fail("canonical decimals drift");
if(token.information?.supply?.wholeTokens!==expected.whole) fail("canonical whole supply drift");
if(token.information?.supply?.baseUnits!==expected.base) fail("canonical base-unit supply drift");
if(token.information?.fees?.serviceFeesSeparateFromPrincipal!==true) fail("service fee must remain separate from principal");
for(const rel of [".env.example","apps/bridge/.env.example","config/env/root.env.example"]){
  const text=fs.readFileSync(path.join(root,rel),"utf8");
  if(!text.includes(`POWERCHAIN_PWRC_EXPECTED_SUPPLY_BASE_UNITS=${expected.base}`)) fail(`${rel} supply drift`);
  if(!text.includes("POWERCHAIN_PWRC_EXPECTED_DECIMALS=9")) fail(`${rel} decimals drift`);
  if(!text.includes("POWERCHAIN_PWRC_TRANSFER_FEE_BPS=0")) fail(`${rel} native fee must be zero`);
  if(!text.includes("POWERCHAIN_SOLANA_PWRC_FEE_MODE=service-fee-separate")) fail(`${rel} fee mode drift`);
}
const integrity=fs.readFileSync(path.join(root,"apps/bridge/server/services/asset-integrity.ts"),"utf8");
if(!integrity.includes('"transferfeeconfig"')) fail("runtime integrity does not forbid TransferFeeConfig");
const inspector=fs.readFileSync(path.join(root,"apps/backend/src/fees/token2022-transfer-fee.ts"),"utf8");
if(!inspector.includes("canonicalPolicyCompliant")||!inspector.includes("REQUIRED_PWRC_TRANSFER_FEE_BPS = 0")) fail("canonical Token-2022 policy inspector missing");
if(!process.exitCode) console.log("token-policy: PASS canonical PWRC supply, decimals, mint, and no-transfer-fee invariants");
