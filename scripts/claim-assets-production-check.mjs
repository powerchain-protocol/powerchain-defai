#!/usr/bin/env node
import fs from "node:fs";

const must = [
  ["apps/bridge/lib/bridge/asset-registry.ts", ["assertOneToOnePrincipal", "wpwrc-sui", "pwrc-solana"]],
  ["apps/bridge/server/services/bridged-assets.ts", ["checkPwrcAssetIntegrity", "authoritativeForBridgeAccounting: false"]],
  ["apps/bridge/app/api/v1/assets/bridge/route.ts", ["Cache-Control", "no-store"]],
  ["apps/bridge/lib/claim/claim-contract.ts", ["ELIGIBLE", "ALREADY_CLAIMED", "claimableBaseUnits"]],
  ["apps/bridge/server/http/claim-mutation-contract.ts", ["Idempotency-Key", "32 * 1024", "request.clone"]],
  ["apps/bridge/components/claim/claim-process-card.tsx", ["server challenge", "unknown submission outcome", "Claim PWRC"]],
  ["apps/bridge/components/bridge/bridged-assets-card.tsx", ["1 PWRC principal = 1 wPWRC principal", "Wormhole NTT"]],
];
let failed = false;
for (const [file, tokens] of must) {
  if (!fs.existsSync(file)) { console.error(`FAIL missing ${file}`); failed = true; continue; }
  const text = fs.readFileSync(file, "utf8");
  for (const token of tokens) if (!text.includes(token)) { console.error(`FAIL ${file}: missing ${token}`); failed = true; }
}
const clientFiles = ["apps/bridge/components/claim/claim-process-card.tsx", "apps/bridge/hooks/use-claim-eligibility.ts"];
for (const file of clientFiles) if (fs.existsSync(file) && /(OPERATOR_API_TOKEN|POWERCHAIN_GOVERNANCE_API_TOKEN|WEBHOOK_SIGNING_SECRET)/.test(fs.readFileSync(file, "utf8"))) { console.error(`FAIL browser secret token in ${file}`); failed = true; }
if (failed) process.exit(1);
console.log("POWERCHAIN_CLAIM_ASSETS_PRODUCTION_CHECK_PASS version=1.0.0");
