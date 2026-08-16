import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const root=process.cwd();
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const token=JSON.parse(read("config/token.json"));
function stable(v){if(v===null||typeof v!=="object")return JSON.stringify(v);if(Array.isArray(v))return`[${v.map(stable).join(",")}]`;return`{${Object.keys(v).sort().map(k=>`${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;}
const computed=createHash("sha256").update(stable(token.information)).digest("hex");
const commitment=token.informationCommitment?.digest;
const checks=[
  [commitment===computed,"config/token.json commitment recomputes"],
  [commitment==="f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5","canonical commitment pinned"],
  [token.information.solana.mint==="PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc","canonical PWRC mint pinned"],
  [JSON.parse(read("tokens/metadata/pwrc.json")).properties.powerchain.informationCommitment===commitment,"PWRC metadata commitment"],
  [JSON.parse(read("tokens/metadata/wpwrc.json")).properties.powerchain.informationCommitment===commitment,"wPWRC metadata commitment"],
  [read("packages/protocol/src/assets.ts").includes("informationCommitment"),"canonical asset registry commitment"],
  [read("apps/backend/src/services/token-information.ts").includes("verifyRuntimeTokenInformation"),"runtime information verifier"],
  [read("apps/bridge/server/services/bridge-runtime.ts").includes('id: "information-commitment"'),"bridge runtime blocking check"],
  [read("packages/sdk/src/client.ts").includes("tokenInformation("),"SDK tokenInformation client"],
  [read("packages/sdk/src/client.ts").includes("POWERCHAIN_INFORMATION_COMMITMENT_MISMATCH"),"SDK rejects commitment mismatch"],
  [read("programs/solana/powerchain_bridge/src/lib.rs").includes("INFORMATION_COMMITMENT_SEED"),"Solana commitment PDA"],
  [read("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move").includes("InformationCommitment"),"Sui commitment object"],
  [read("apps/bridge/server/openapi.ts").includes("/api/v1/token/information"),"OpenAPI token information route"],
  [read("api/swagger.yaml").includes("/api/v1/token/information"),"Swagger token information route"],
  [JSON.parse(read("build-manifest.json")).informationCommitment===commitment,"build manifest commitment binding"],
];
const failed=checks.filter(([ok])=>!ok);for(const [ok,label] of checks)console.log(`${ok?"PASS":"FAIL"} ${label}`);if(failed.length)process.exit(1);console.log(`Information commitment production PASS — ${checks.length} checks`);
