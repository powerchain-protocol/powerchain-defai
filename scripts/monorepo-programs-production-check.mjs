import fs from "node:fs";
const required = [
  "packages/bridge-core/package.json",
  "packages/bridge-core/src/intent.ts",
  "apps/backend/src/bridge/contracts.ts",
  "programs/solana/powerchain_bridge/src/lib.rs",
  "programs/solana/powerchain_staking/src/lib.rs",
  "programs/solana/powerchain_escrow/src/lib.rs",
  "config/staking.json",
  "config/escrow.json",
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

const staking = fs.readFileSync("programs/solana/powerchain_staking/src/lib.rs", "utf8");
for (const token of [
  "reward_allocation_cap_base_units",
  "pub fn fund_rewards",
  "pub fn stake",
  "pub fn request_unstake",
  "pub fn withdraw_unstaked",
  "pub fn claim_rewards",
  "RewardPolicyLockedWhileStaked",
  "TransferAmountTooSmall",
]) if (!staking.includes(token)) throw new Error(`SOLANA_STAKING_PROGRAM_MISSING:${token}`);
if (staking.includes("REWARD_ALLOCATION_CAP_BASE_UNITS")) throw new Error("SOLANA_STAKING_HARDCODED_REWARD_CAP_FORBIDDEN");
for (const forbidden of [/mint_to\s*\(/, /burn\s*\(/]) if (forbidden.test(staking)) throw new Error(`SOLANA_STAKING_FORBIDDEN_TOKEN_OPERATION:${forbidden}`);
const stakingConfig = JSON.parse(fs.readFileSync("config/staking.json", "utf8"));
if (stakingConfig.rewards?.model !== "fixed-pool" || stakingConfig.rewards?.allocationPolicy !== "on-chain-configured-cap" || stakingConfig.rewards?.allocationBaseUnits !== "UNVERIFIED") throw new Error("STAKING_FIXED_POOL_POLICY_MISMATCH");

const escrow = fs.readFileSync("programs/solana/powerchain_escrow/src/lib.rs", "utf8");
for (const token of ["RECEIPT_SEED", "ALLOWED_MINT_SEED", "EXTENSIONS_SEED", "pub fn deposit", "pub fn withdraw", "PreDeposit", "PostDeposit", "PreWithdraw", "PostWithdraw", "BlockedPermanentDelegate", "BlockedNonTransferable", "BlockedPausable", "EscrowImmutable"]) if (!escrow.includes(token)) throw new Error(`SOLANA_ESCROW_PROGRAM_MISSING:${token}`);
const escrowConfig = JSON.parse(fs.readFileSync("config/escrow.json", "utf8"));
if (escrowConfig.status !== "deployment-gated" || escrowConfig.signing?.connectedWalletSigns !== true || escrowConfig.signing?.backendCustody !== false) throw new Error("ESCROW_DEPLOYMENT_POLICY_MISMATCH");

const sui = fs.readFileSync("contracts/sui/powerchain_bridge/sources/powerchain_bridge.move", "utf8");
for (const token of ["assert_valid_intent", "BridgeIntentV2", "BRIDGE_INTENT_EVENT_VERSION", "observed_epoch", "tx_context::epoch(ctx)"]) if (!sui.includes(token)) throw new Error(`SUI_PROGRAM_UPGRADE_MISSING:${token}`);
for (const source of [solana, sui]) for (const forbidden of ["mint_to", "burn", "unlock", "custody"]) {
  if (forbidden !== "custody" && source.includes(` ${forbidden}(`)) throw new Error(`ALTERNATE_SETTLEMENT_FORBIDDEN:${forbidden}`);
}
console.log("monorepo-programs-production-check: PASS");
