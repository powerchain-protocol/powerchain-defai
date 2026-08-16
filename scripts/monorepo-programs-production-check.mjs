import fs from "node:fs";
const required = [
  "packages/bridge-core/package.json",
  "packages/bridge-core/src/intent.ts",
  "apps/backend/src/bridge/contracts.ts",
  "programs/solana/powerchain_bridge/src/lib.rs",
  "contracts/sui/powerchain_bridge/sources/powerchain_bridge.move",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`MONOREPO_PROGRAM_FILE_MISSING:${file}`);
const pkg = JSON.parse(fs.readFileSync("packages/bridge-core/package.json", "utf8"));
if (pkg.version !== "1.0.0") throw new Error("BRIDGE_CORE_VERSION_MUST_REMAIN_1.0.0");
const core = fs.readFileSync("packages/bridge-core/src/intent.ts", "utf8");
for (const token of ["BRIDGE_INTENT_VERSION = 2", "BRIDGE_INTENT_MAX_DESTINATION_BYTES", "BRIDGE_QUOTE_COMMITMENT_BYTES", "canonicalBridgeIntent", "canonicalBridgeAddresses", "BRIDGE_QUOTE_COMMITMENT_ZERO_FORBIDDEN"]) if (!core.includes(token)) throw new Error(`BRIDGE_CORE_INVARIANT_MISSING:${token}`);
const bridgeIntent = fs.readFileSync("apps/bridge/server/services/bridge-intent.ts", "utf8");
if (!bridgeIntent.includes("canonicalBridgeAddresses")) throw new Error("BRIDGE_INTENT_MUST_USE_CANONICAL_ADDRESSES");
const backend = fs.readFileSync("apps/backend/src/bridge/contracts.ts", "utf8");
if (!backend.includes("@powerchain/bridge-core")) throw new Error("BACKEND_MUST_CONSUME_BRIDGE_CORE");
const solana = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
for (const token of ["validate_record_intent_args", "BridgeIntentRecordedV2", "BRIDGE_INTENT_EVENT_VERSION", "InformationCommitmentVersionMismatch", "Clock::get()?"]) if (!solana.includes(token)) throw new Error(`SOLANA_PROGRAM_UPGRADE_MISSING:${token}`);
const sui = fs.readFileSync("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move", "utf8");
for (const token of ["assert_valid_intent", "BridgeIntentV2", "BRIDGE_INTENT_EVENT_VERSION", "observed_epoch", "tx_context::epoch(ctx)"]) if (!sui.includes(token)) throw new Error(`SUI_PROGRAM_UPGRADE_MISSING:${token}`);
for (const source of [solana, sui]) for (const forbidden of ["mint_to", "burn", "unlock", "custody"]) {
  if (forbidden !== "custody" && source.includes(` ${forbidden}(`)) throw new Error(`ALTERNATE_SETTLEMENT_FORBIDDEN:${forbidden}`);
}
console.log("monorepo-programs-production-check: PASS");
