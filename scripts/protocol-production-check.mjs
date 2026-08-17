import fs from "node:fs";
const required = [
  "packages/protocol/src/addresses.ts", "packages/protocol/src/integrations.ts", "packages/protocol/src/explorers.ts",
  "packages/protocol/src/fees.ts", "packages/bridge-core/src/intent.ts", "packages/protocol/src/transactions.ts", "packages/protocol/src/validate.ts", "packages/protocol/src/signatures.ts",
  "programs/solana/Anchor.toml", "programs/solana/powerchain_bridge/src/lib.rs",
  "contracts/sui/powerchain_bridge/Move.toml", "contracts/sui/powerchain_bridge/sources/powerchain_bridge.move",
  "apps/backend/src/bridge/sui-targets.ts", "config/sui-bridge.json",
  "apps/bridge/components/ui/toast.tsx", "apps/bridge/lib/toast.ts",
  "apps/bridge/components/wallet/wallet-provider.tsx", "apps/bridge/components/wallet/wallet-connect-modal.tsx",
  "prisma/migrations/20260815000400_protocol_deployments/migration.sql",
  "supabase/migrations/20260815000400_protocol_deployments.sql"
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing protocol file: ${file}`);
const rootPackage = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (rootPackage.version !== "1.0.0") throw new Error("ROOT_VERSION_MUST_REMAIN_1.0.0");
if (rootPackage.engines?.node !== ">=24 <26") throw new Error("NODE_ENGINE_RANGE_MISMATCH");
const all = [...fs.readdirSync("apps", { withFileTypes: true }).filter(e=>e.isDirectory()).map(e=>`apps/${e.name}/package.json`), ...fs.readdirSync("packages", { withFileTypes: true }).filter(e=>e.isDirectory()).map(e=>`packages/${e.name}/package.json`)];
for (const file of all) if (fs.existsSync(file)) { const p=JSON.parse(fs.readFileSync(file,"utf8")); if (p.version !== "1.0.0") throw new Error(`${file}: version must be 1.0.0`); }
const tsconfigs = [];
function walk(dir){ for(const e of fs.readdirSync(dir,{withFileTypes:true})){ if(["node_modules",".next","target"].includes(e.name)) continue; const f=`${dir}/${e.name}`; if(e.isDirectory()) walk(f); else if(/^tsconfig.*\.json$/.test(e.name)) tsconfigs.push(f); }}
walk(".");
for(const file of tsconfigs){ const t=JSON.parse(fs.readFileSync(file,"utf8")); if(t.compilerOptions?.baseUrl) throw new Error(`${file}: deprecated baseUrl forbidden`); }

const anchorProgram = fs.readFileSync("programs/solana/powerchain_bridge/src/lib.rs", "utf8");
for (const token of [
  'declare_id!("BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS")',
  'pub struct BridgeConfig',
  'pub fn initialize_config',
  'pub fn set_authority',
  'BridgeError::UnauthorizedAuthority',
  'BridgeError::ProgramCannotBeAuthority',
  'BridgeAuthorityUpdated',
  'pub fn set_paused',
  'pub next_nonce: u64',
  'BridgePauseUpdated',
  'BridgeError::BridgePaused',
  'BridgeError::InvalidQuoteHash',
  'BridgeError::DestinationRequired',
  'BridgeIntentRecordedV2',
  'validate_record_intent_args',
  'InformationCommitmentVersionMismatch'
]) if (!anchorProgram.includes(token)) throw new Error(`Solana bridge authority model missing: ${token}`);

const suiProgram = fs.readFileSync("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move", "utf8");
for (const token of [
  "public struct BridgeConfig has key",
  "public entry fun set_authority",
  "public entry fun set_paused",
  "public entry fun record_intent",
  "next_nonce: u64",
  "vector::length(quote_hash) == 32",
  "BridgeAuthorityUpdated",
  "BridgePauseUpdated",
  "is_all_zero(quote_hash)",
  "E_INVALID_DESTINATION",
  "BridgeIntentV2",
  "assert_valid_intent"
]) if (!suiProgram.includes(token)) throw new Error(`Sui bridge authority model missing: ${token}`);


const suiTargets = fs.readFileSync("apps/backend/src/bridge/sui-targets.ts", "utf8");
for (const token of ["normalizeSuiAddress", "POWERCHAIN_SUI_BRIDGE_MODULE", "record_intent"]) if (!suiTargets.includes(token)) throw new Error(`SUI_TARGET_MODEL_MISSING:${token}`);
const suiTargetConfig = JSON.parse(fs.readFileSync("config/sui-bridge.json", "utf8"));
if (suiTargetConfig.version !== "1.0.0" || suiTargetConfig.sourceAddress !== "0x0" || suiTargetConfig.principalMovement !== "wormhole-ntt-only") throw new Error("SUI_TARGET_CONFIG_INVALID");

const envTemplate = fs.readFileSync(".env.example", "utf8");
if (!envTemplate.includes("POWERCHAIN_SOLANA_BRIDGE_PROGRAM_ID=BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS")) throw new Error("SOLANA_BRIDGE_PROGRAM_ID_TEMPLATE_MISMATCH");
if (!envTemplate.includes("POWERCHAIN_SOLANA_BRIDGE_AUTHORITY=")) throw new Error("SOLANA_BRIDGE_AUTHORITY_TEMPLATE_MISSING");
for (const token of [
  "POWERCHAIN_SUI_BRIDGE_PACKAGE_ID=",
  "POWERCHAIN_SUI_BRIDGE_AUTHORITY=",
  "POWERCHAIN_SUI_BRIDGE_CONFIG_OBJECT_ID=",
  "POWERCHAIN_DEFAULT_BRIDGE_DIRECTION=SUI_TO_SOLANA"
]) if (!envTemplate.includes(token)) throw new Error(`BRIDGE_ENV_TEMPLATE_MISSING:${token}`);

console.log(`protocol-production-check: PASS (${required.length} required files, ${tsconfigs.length} tsconfigs)`);
